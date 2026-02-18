import jwt from 'jsonwebtoken';
import { RedisClient } from "../config/redis";
import logger from "../config/logger";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs"
// going to need the redis client for a blocklist - for refresh tokens , no need for access tokens since they are short lived and we can just wait for them to expire


const ACCESS_TOKEN_PRIVATE_KEY = getPemKey(process.env.ACCESS_TOKEN_PRIVATE_KEY_PATH || ""); // load a pem file - no need for public since 
const ACCESS_TOKEN_PUBLIC_KEY = getPemKey(process.env.ACCESS_TOKEN_PUBLIC_KEY_PATH || ""); //  for verifying access tokens
const XSRF_TOKEN_KEY = process.env.XSRF_TOKEN_KEY || ""
const REFRESH_TOKEN_KEY = process.env.REFRESH_TOKEN_KEY || ""; // symmetric key since only the auth service will access and verify it
const AUDIENCE = "SecureWebIotPlatform"; // the audience for the tokens - can be used to verify that the token is intended for this service

const ErrNoUserId = "User ID is required to generate token";
const ErrNoExpire = "Expiration time is required to generate token";
const ErrNoIssuer = "Issuer is required to generate token";

const WEEK_IN_SECONDS = 7 * 24 * 60 * 60; // one week in seconds
const ACCESS_TOKEN_EXPIRATION = 15 * 60; // access tokens expire in 15 minutes - in seconds

declare global {
    namespace Express {
        interface Request {
            user?: AccessTokenClaims; // the user information from the access token claims - will be used in the controllers to access the users information
        }
    }
}
export interface RefreshTokenClaims {
    sub: string; // user id
    aud: string; // audience
    iss: string; // issuer
    exp: Seconds; // expiration time in seconds
    iat: number; // issued at time in seconds
    jti: string; // unique identifier for the token - used for blocklisting
}
export interface AccessTokenClaims {
    sub: string; // user id
    aud: string; // audience
    iss: string; // issuer
    exp: Seconds; // expiration time in seconds
    iat: number; // issued at time in seconds
}

interface Tokens {
    accessToken: string;
    refreshToken: string;
    xsrfToken: string;
}

type Seconds = number; // just easier to understand that the values are in seconds

export class TokenBundle {

    /**
     * 
     * @param userId  - the user id to add to the token claims
     * @returns Tokens - the generated access token, refresh token and xsrf token
     * @description creates a new token bundle for the given user id - used for login - the access token will have a issuer of "LOGIN" and the refresh token will have a issuer of "LOGIN" as well since it is being issued on login - the xsrf token will have a issuer of "XSRF" and its subject will be the jti of the refresh token and it will expire at the same time as the refresh token
     */
    static CreateBundle(userId: string): Tokens & { expiry: Seconds } { // expiry date for the xsrf token to match the refresh token
        const accessToken = CreateAccessToken(userId, "LOGIN");
        const { token: refreshToken, jti, expiry } = CreateRefreshToken(userId);
        const xsrfToken = CreateXsrfToken(jti, expiry); // xsrf token should expire at the same time as the refresh token

        return {
            accessToken,
            refreshToken,
            xsrfToken,
            expiry
        }
    }


    /**
     * 
     * @param claims - the claims of the previous refresh token
     * @returns Tokens - the new access token, refresh token and xsrf token
     * @description creates a new token bundle from the claims of the previous refresh token
     */
    static async RefreshTokens(claims: RefreshTokenClaims): Promise<Tokens & { expiry: Seconds }> { // for token rotation
        try {
            const { exp: oldExpiry } = claims;
            const { token: refreshToken, jti: newJti, expiry } = CreateRefreshFromClaims(claims); // create a new refresh token and a new jwt for the XSRF token
            const accessToken = CreateAccessToken(claims.sub, "REFRESH");
            const xsrfToken = CreateXsrfToken(newJti, expiry); // xsrf token should expire at the same time as the refresh token
            await BlockToken(claims.jti, oldExpiry); // blocklist the old refresh token - we want to do this before returning the new tokens to prevent
            return {
                accessToken,
                refreshToken,
                xsrfToken,
                expiry
            }
        } catch (error) {
            throw new Error(`Error refreshing tokens`, { cause: error });
        }

    }
}


/**
 * 
 * @param userId - the user id to include in the token claims
 * @param expire - the expiration time of the token
 * @param issuer - the service issuing the token . i.e  LOGIN or REFRESH
 * @returns - the generated refresh token and its jti
 * @description - generates a refresh token with the given inputs and return the token and its jti.
 * * the jti is used xsrf token creation and for later blocklisting but the jti is alread in the token claims so it can be extracted when needed
 */
function createRefreshToken(userId: string, expire: Date, issuer: string): { token: string, jti: string, expiry: Seconds } { // the actual function to generate refresh tokens
    if (!userId) {
        throw new Error(ErrNoUserId);
    }
    if (!expire) {
        throw new Error(ErrNoExpire);
    }
    if (!issuer) {
        throw new Error(ErrNoIssuer);
    }
    try {
        const jwtId = randomUUID(); // generate uuid - going to be used for the blocklisting - because just doing it by userid would kill after the first refresh
        const expireInSeconds: Seconds = Math.floor(expire.getTime() / 1000);
        const registeredClaims = {
            sub: userId,
            aud: AUDIENCE,
            iss: issuer,
            exp: expireInSeconds, // expiration time in seconds
            iat: Math.floor(Date.now() / 1000), // issued at time
            jti: jwtId, // unique identifier for the token - used for blocklisting
        }
        const token = jwt.sign(registeredClaims, REFRESH_TOKEN_KEY, { algorithm: 'HS256' });
        return {
            token, jti: jwtId, expiry: expireInSeconds
        }
    } catch (err) {
        throw new Error(`Error generating refresh token`, { cause: err });
    }
}


/**
 * 
 * @param userId - the user id to include in the token claims
 * @returns the generated refresh token and its jti 
 */
export function CreateRefreshToken(userId: string) { // create a refresh token on login - wrapper for generateRefreshToken
    const weekFromNowMil = new Date(Date.now() + WEEK_IN_SECONDS * 1000); // week from now in milliseconds
    return createRefreshToken(userId, weekFromNowMil, "LOGIN");
}

/**
 * 
 * @param claims - the claims of the previous refresh token that will be used to create the new refresh token
 * @returns  - the generated refresh token and its jti
 * @description creates a refresh token from the claims of a previous refresh token - for token rotation 
 */
export function CreateRefreshFromClaims(claims: RefreshTokenClaims) { // create a refresh token from the claims of a previous refresh token - for token rotation-wrapper for generateRefreshToken
    // expiry date should be the same as the incomming token 
    if (!claims) {
        throw new Error("Claims are required to create refresh token from claims");
    }
    const { sub, exp } = claims;
    return createRefreshToken(sub, new Date(exp * 1000), "REFRESH");
}


/**
 * 
 * @param userId - the user id to include in the token claims
 * @param issuer  - the service issuing the token . i.e  LOGIN or REFRESH
 * @returns the generated access token
 * @description generates an access token with the given user id and issuer .
 */

export function CreateAccessToken(userId: string, issuer: string): string {
    if (!userId) {
        throw new Error(ErrNoUserId);
    }
    if (!issuer) {
        throw new Error(ErrNoIssuer);
    }
    try {
        const registeredClaims = {
            sub: userId,
            aud: AUDIENCE,
            iss: issuer,
            exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRATION, // access tokens expire in 15 minutes
            iat: Math.floor(Date.now() / 1000), // issued at time
        }
        const token = jwt.sign(registeredClaims, ACCESS_TOKEN_PRIVATE_KEY, { algorithm: 'RS256' });
        return token;
    } catch (err) {
        throw new Error(`Error generating access token`, { cause: err });
    }
}


export function CreateXsrfToken(jti: string, expiry: Seconds): string { //good thing about the xsrf token is that it dosent need to be blocked since its tied to a single refresh token and is dead when the refrehs token is dead
    if (!jti) {
        throw new Error("JTI is required to create XSRF token");
    }
    if (!expiry) {
        throw new Error("Expiry is required to create XSRF token");
    }
    try {
        const registeredClaims = {
            sub: jti,
            aud: AUDIENCE,
            iss: "XSRF",
            exp: expiry, // xsrf tokens expire at the given expiry date
            iat: Math.floor(Date.now() / 1000), // issued at time
        }
        const token = jwt.sign(registeredClaims, XSRF_TOKEN_KEY, { algorithm: 'HS256' });
        return token;
    } catch (error) {
        throw new Error(`Error generating XSRF token`, { cause: error });
    }

}
/**
 * 
 * @param token  - the accress token to verify
 * @returns the claims of the token if it is valid, otherwise null - will return null if the token is expired or invalid for any reason
 * @description verifies an access token and returns the claims if it is valid, otherwise returns null - will return null if the token is expired or invalid for any reason
 * @throws Error if theres an error during verification that isnt related to token invalidity or expiration 
*/

export function VerifyAccessToken(token: string): AccessTokenClaims | null { // null and val will act as truthy
    if (!token) {
        throw new Error("Token is required to verify access token");
    }
    try {
        const r = jwt.verify(token, ACCESS_TOKEN_PUBLIC_KEY, { algorithms: ['RS256'], audience: AUDIENCE }) as AccessTokenClaims;
        return r;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return null; // token is expired - treat as invalid
        }
        if (error instanceof jwt.JsonWebTokenError) { // if theres any token invalidity like signature is different or the token is malformed
            logger.warn({ token }, `Invalid Access token ${error.message}`); // log the invalid token for debugging - should be safe since these tokens are all invalid to the system
        }
        throw new Error(`Error verifying access token`, { cause: error });
    }
}

/**
 * 
 * @param token - the refresh token to verify
 * @returns the claims of the token if it is valid, otherwise null - will return null if the token is expired or invalid for any reason
 * @description verifies a refresh token and returns the claims if it is valid, otherwise returns null - will return null if the token is expired or invalid for any reason
 * @throws Error if theres an error during verification that isnt related to token invalidity or expiration 
*/

export function VerifyRefreshToken(token: string): RefreshTokenClaims | null {// null and val will act as truthy
    if (!token) {
        throw new Error("Token is required to verify refresh token");
    }
    try {
        const r = jwt.verify(token, REFRESH_TOKEN_KEY, { algorithms: ['HS256'], audience: AUDIENCE }) as RefreshTokenClaims;
        return r;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return null; // token is expired - treat as invalid
        }
        if (error instanceof jwt.JsonWebTokenError) { // if theres any token invalidity like signature is different or the token is malformed
            logger.warn({ token }, `Invalid refresh token ${error.message}`); // log the invalid token for debugging - should be safe since these tokens are all invalid to the system
        }
        throw new Error(`Error verifying refresh token`, { cause: error });
    }
}

/**
 * 
 * @param token - the xsrf token to verify
 * @param jti  - the jti to compare with the sub claim in the token - should be derived from the refresh token
 * @returns - true if the xsrf token is valid and its sub matches the jti - false if otherwise 
 * @throws Error if theres verification errors or token invalidity 
 */

export function VerifyXsrfToken(token: string, jti: string): boolean { // verify the xsrf token by verifying its signature and checking if the jti in its claims matches the given jti
    if (!token) {
        throw new Error("Token is required to verify XSRF token");
    }
    if (!jti) {
        throw new Error("JTI is required to verify XSRF token");
    }
    try {
        const claims = jwt.verify(token, XSRF_TOKEN_KEY, { algorithms: ['HS256'], audience: AUDIENCE }) as jwt.JwtPayload;
        return claims.sub === jti; // check if the jti in the claims matches the given jti
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return false; // token is expired - treat as invalid
        }
        if (error instanceof jwt.JsonWebTokenError) { // if theres any token invalidity like signature is different or the token is malformed
            logger.warn({ token }, `Invalid XSRF token ${error.message}`); // log the invalid token for debugging - should be safe since these tokens are all invalid to the system
        }
        throw new Error(`Error verifying XSRF token`, { cause: error });
    }
}


/**
 * @param jti the unique identifier of the token to check
 * @returns true if the token is blocklisted, false otherwise
 * @description checks if a token is blocklisted by checking if the jti is in the blocklist - used for refresh tokens only
 * @throws Error if theres an error during the blocklist check
 */
export async function IsBlocked(jti: string): Promise<boolean> { // check if a token is blocklisted - used for refresh tokens
    if (!jti) {
        throw new Error("JTI is required to check if token is blocked");
    }
    try {
        const result = await RedisClient.get(jti);
        return result !== null; // if the result is null, the token is not blocklisted, otherwise it is
    } catch (err) {
        throw new Error(`Error checking if token is blocked`, { cause: err });
    }
}


/**
 * 
 * @param jti the unique identifier of the token to block
 * @param exp the expiration time of the token to block
 * @description adds a token to the blocklist by addiing its jti to the list of blocked tokens
 * @throws Error if theres an error during the blocklisting process
 */
export async function BlockToken(jti: string, exp: Seconds): Promise<void> { // blocklist a token - used for refresh tokens
    // set the blocklist key to expire at the same time as the token - so we don't have to worry about cleaning up expired blocklist entries
    if (!jti) {
        throw new Error("JTI is required to block token");
    }
    if (!exp) {
        throw new Error("Expiration time is required to block token");
    }
    try {
        const ttl = exp - Math.floor(Date.now() / 1000)
        if (ttl <= 0) {
            return; // token is already expired, no need to blocklist
        }
        await RedisClient.set(jti, "blocked", { expiration: { type: "EX", value: ttl } }); // set the blocklist key to expire at the same time as the token
    } catch (err) {
        throw new Error(`Error blocking token`, { cause: err });
    }
}



/**
 * 
 * @param keyPath 
 * @returns string - the PEM key as a string
 * @description - loads the PEM key from the given path and returns it as a string - used for loading the private and public keys for access tokens
 */
function getPemKey(keyPath: string): string {
    if (!keyPath) {
        throw new Error("Key path is required to load PEM key");
    }
    try {
        const keyData = readFileSync(keyPath, "utf-8");
        return keyData;
    } catch (err) {
        throw new Error(`Error loading PEM key`, { cause: err });
    }
}