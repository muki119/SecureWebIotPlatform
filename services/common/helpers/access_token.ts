import type { AccessTokenClaims } from "../types";
import { GetPemKey, GetEnvString } from "../utilities/getEnv";
import jwt from "jsonwebtoken";
const ACCESS_TOKEN_PUBLIC_KEY = GetPemKey("ACCESS_TOKEN_PUBLIC_KEY_PATH"); //  for verifying access tokens
const AUDIENCE = GetEnvString("TOKEN_AUDIENCE");
/**
 * 
 * @param token  - the accress token to verify
 * @returns the claims of the token if it is valid, otherwise null - will return null if the token is expired or invalid for any reason
 * @description verifies an access token and returns the claims if it is valid, otherwise returns null - will return null if the token is expired or invalid for any reason
 * @throws Error if theres an error during verification that isnt related to token invalidity or expiration 
*/

export function VerifyAccessToken(token: string): AccessTokenClaims | null { // null and val will act as truthy
    if (!token) {
        return null; // if theres no token then just treat it as invalid and return null
    }
    try {
        const r = jwt.verify(token, ACCESS_TOKEN_PUBLIC_KEY, { algorithms: ['RS256'], audience: AUDIENCE }) as AccessTokenClaims;
        return r;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return null; // token is expired - treat as invalid
        }
        if (error instanceof jwt.JsonWebTokenError) { // if theres any token invalidity like signature is different or the token is malformed
            //logger.warn({ token }, `Invalid Access token: ${error.message}`); // log the invalid token for debugging - should be safe since these tokens are all invalid to the system
            return null;
        }
        throw new Error(`Error verifying access token`, { cause: error });
    }
}


export function CreateVerifyAccessTokenInstance(logger: any) { // have to make a factory function because the logger may have different configurations - but will all be a pino instance anyway 
    return (token: string): AccessTokenClaims | null => {
        if (!token) {
            return null; // if theres no token then just treat it as invalid and return null
        }
        try {
            const r = jwt.verify(token, ACCESS_TOKEN_PUBLIC_KEY, { algorithms: ['RS256'], audience: AUDIENCE }) as AccessTokenClaims;
            return r;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                return null; // token is expired - treat as invalid
            }
            if (error instanceof jwt.JsonWebTokenError) { // if theres any token invalidity like signature is different or the token is malformed
                logger.warn({ token }, `Invalid Access token: ${error.message}`); // log the invalid token for debugging - should be safe since these tokens are all invalid to the system
                return null;
            }
            throw new Error(`Error verifying access token`, { cause: error });
        }
    }
}