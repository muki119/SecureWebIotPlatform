import { randomUUID } from "node:crypto";
import { CreateVerifyAccessTokenInstance } from "@services/common/helpers";
import type {
	AccessTokenClaims,
	RefreshTokenClaims,
	Result,
	Seconds,
	Tokens,
} from "@services/common/types";
import jwt from "jsonwebtoken";
import type { RedisClientPoolType } from "redis";
import logger from "../config/logger";

const ErrNoUserId = "User ID is required to generate token";
const ErrNoExpire = "Expiration time is required to generate token";
const ErrNoIssuer = "Issuer is required to generate token";
export const ErrBlockedToken = "Token is blocked";

const WEEK_IN_SECONDS = 7 * 24 * 60 * 60; // one week in seconds

export type TokenBundleConfig = {
	accessTokenPrivateKey: string;
	accessTokenPublicKey?: string;
	xsrfTokenKey: string;
	refreshTokenKey: string;
	audience: string;
	accessTokenExpiration?: number;
	blocklistClient: Pick<RedisClientPoolType, "get" | "set">; // partial since we only need the set and get methods - this is to allow for easier testing with a mock redis client
};

export class TokenBundle {
	private ACCESS_TOKEN_PRIVATE_KEY: string;
	private XSRF_TOKEN_KEY: string;
	private REFRESH_TOKEN_KEY: string;
	private AUDIENCE: string;

	private blocklistClient: Pick<RedisClientPoolType, "get" | "set">; // partial since we only need the set and get methods - this is to allow for easier testing with a mock redis client

	private ACCESS_TOKEN_EXPIRATION: number;

	constructor(config: TokenBundleConfig) {
		this.ACCESS_TOKEN_PRIVATE_KEY = config.accessTokenPrivateKey;
		this.AUDIENCE = config.audience;
		this.VerifyAccessToken = CreateVerifyAccessTokenInstance(
			logger,
			config.accessTokenPublicKey,
			config.audience,
		); // create a verify access token function with the logger instance - this way we can log invalid tokens with the correct logger configuration without having to pass the logger around everywhere
		this.XSRF_TOKEN_KEY = config.xsrfTokenKey;
		this.REFRESH_TOKEN_KEY = config.refreshTokenKey;

		this.ACCESS_TOKEN_EXPIRATION = config.accessTokenExpiration || 15 * 60; // default to 15 minutes if not provided
		this.blocklistClient = config.blocklistClient;
	}
	/**
	 *
	 * @param userId  - the user id to add to the token claims
	 * @returns Tokens - the generated access token, refresh token and xsrf token
	 * @description creates a new token bundle for the given user id - used for login - the access token will have a issuer of "LOGIN" and the refresh token will have a issuer of "LOGIN" as well since it is being issued on login - the xsrf token will have a issuer of "XSRF" and its subject will be the jti of the refresh token and it will expire at the same time as the refresh token
	 */
	CreateBundle(userId: string): Tokens & { expiry: Seconds } {
		// expiry date for the xsrf token to match the refresh token
		const issuer = "LOGIN";
		const accessToken = this.CreateAccessToken(userId, issuer);
		const {
			token: refreshToken,
			jti,
			expiry,
		} = this.CreateRefreshToken(userId);
		const xsrfToken = this.CreateXsrfToken(jti, expiry, issuer); // xsrf token should expire at the same time as the refresh token

		return {
			accessToken,
			refreshToken,
			xsrfToken,
			expiry,
		};
	}

	/**
	 *
	 * @param claims - the claims of the previous refresh token
	 * @returns Tokens - the new access token, refresh token and xsrf token
	 * @description creates a new token bundle from the claims of the previous refresh token
	 */
	async RefreshTokens(
		claims: RefreshTokenClaims,
	): Promise<Result<Tokens & { expiry: Seconds }>> {
		// for token rotation
		try {
			const { exp: oldExpiry, jti: oldJti } = claims;
			const isBlocked = await this.IsBlocked(oldJti);
			if (isBlocked) {
				return [null, new Error(ErrBlockedToken)];
			}
			const issuer = "REFRESH";
			const {
				token: refreshToken,
				jti: newJti,
				expiry,
			} = this.CreateRefreshFromClaims(claims); // create a new refresh token and a new jwt for the XSRF token
			const accessToken = this.CreateAccessToken(claims.sub, issuer);
			const xsrfToken = this.CreateXsrfToken(newJti, expiry, issuer); // xsrf token should expire at the same time as the refresh token
			const [_, blockError] = await this.BlockToken(
				claims.jti,
				oldExpiry,
			); // blocklist the old refresh token - we want to do this before returning the new tokens to prevent
			if (blockError) {
				return [null, blockError];
			}
			return [
				{
					accessToken,
					refreshToken,
					xsrfToken,
					expiry,
				},
				null,
			];
		} catch (error) {
			throw new Error(`Error refreshing tokens`, { cause: error });
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
	private createRefreshToken(
		userId: string,
		expire: Date,
		issuer: string,
	): { token: string; jti: string; expiry: Seconds } {
		// the actual function to generate refresh tokens
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
			const expireInSeconds: Seconds = Math.floor(
				expire.getTime() / 1000,
			);
			const registeredClaims = {
				sub: userId,
				aud: this.AUDIENCE,
				iss: issuer,
				exp: expireInSeconds, // expiration time in seconds
				iat: Math.floor(Date.now() / 1000), // issued at time
				jti: jwtId, // unique identifier for the token - used for blocklisting
			};
			const token = jwt.sign(registeredClaims, this.REFRESH_TOKEN_KEY, {
				algorithm: "HS256",
			});
			return {
				token,
				jti: jwtId,
				expiry: expireInSeconds,
			};
		} catch (err) {
			throw new Error(`Error generating refresh token`, { cause: err });
		}
	}

	/**
	 *
	 * @param userId - the user id to include in the token claims
	 * @returns the generated refresh token and its jti
	 */
	private CreateRefreshToken(userId: string) {
		// create a refresh token on login - wrapper for generateRefreshToken
		const weekFromNowMil = new Date(Date.now() + WEEK_IN_SECONDS * 1000); // week from now in milliseconds
		return this.createRefreshToken(userId, weekFromNowMil, "LOGIN");
	}

	/**
	 *
	 * @param claims - the claims of the previous refresh token that will be used to create the new refresh token
	 * @returns  - the generated refresh token and its jti
	 * @description creates a refresh token from the claims of a previous refresh token - for token rotation
	 */
	private CreateRefreshFromClaims(claims: RefreshTokenClaims) {
		// create a refresh token from the claims of a previous refresh token - for token rotation-wrapper for generateRefreshToken
		// expiry date should be the same as the incomming token
		if (!claims) {
			throw new Error(
				"Claims are required to create refresh token from claims",
			);
		}
		const { sub, exp } = claims;
		return this.createRefreshToken(sub, new Date(exp * 1000), "REFRESH");
	}

	/**
	 *
	 * @param userId - the user id to include in the token claims
	 * @param issuer  - the service issuing the token . i.e  LOGIN or REFRESH
	 * @returns the generated access token
	 * @description generates an access token with the given user id and issuer .
	 */

	private CreateAccessToken(userId: string, issuer: string): string {
		if (!userId) {
			throw new Error(ErrNoUserId);
		}
		if (!issuer) {
			throw new Error(ErrNoIssuer);
		}
		try {
			const registeredClaims = {
				sub: userId,
				aud: this.AUDIENCE,
				iss: issuer,
				exp:
					Math.floor(Date.now() / 1000) +
					this.ACCESS_TOKEN_EXPIRATION, // access tokens expire in 15 minutes
				iat: Math.floor(Date.now() / 1000), // issued at time
			};
			const token = jwt.sign(
				registeredClaims,
				this.ACCESS_TOKEN_PRIVATE_KEY,
				{ algorithm: "RS256" },
			);
			return token;
		} catch (err) {
			throw new Error(`Error generating access token`, { cause: err });
		}
	}

	/**
	 *
	 * @param jti - the jti to include in the token claims
	 * @param expiry - the expiry time for the token
	 * @param issuer - the service issuing the token
	 * @returns the generated XSRF token
	 * @description generates an XSRF token with the given claims
	 */
	private CreateXsrfToken(
		jti: string,
		expiry: Seconds,
		issuer: string,
	): string {
		//good thing about the xsrf token is that it dosent need to be blocked since its tied to a single refresh token and is dead when the refrehs token is dead
		if (!jti) {
			throw new Error("JTI is required to create XSRF token");
		}
		if (!expiry) {
			throw new Error("Expiry is required to create XSRF token");
		}
		try {
			const registeredClaims = {
				sub: jti,
				aud: this.AUDIENCE,
				iss: issuer,
				exp: expiry, // xsrf tokens expire at the given expiry date
				iat: Math.floor(Date.now() / 1000), // issued at time
			};
			const token = jwt.sign(registeredClaims, this.XSRF_TOKEN_KEY, {
				algorithm: "HS256",
			});
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

	public VerifyAccessToken: (token: string) => Result<AccessTokenClaims>; // will be set in the constructor to a function that uses the logger instance to log any errors that may occur during verification

	/**
	 *
	 * @param token - the refresh token to verify
	 * @returns the claims of the token if it is valid, otherwise null - will return null if the token is expired or invalid for any reason
	 * @description verifies a refresh token and returns the claims if it is valid, otherwise returns null - will return null if the token is expired or invalid for any reason
	 * @throws Error if theres an error during verification that isnt related to token invalidity or expiration
	 */

	public VerifyRefreshToken(token: string): RefreshTokenClaims | null {
		// null and val will act as truthy
		if (!token) {
			return null; // if theres no token then just treat it as invalid and return null
		}
		try {
			const r = jwt.verify(token, this.REFRESH_TOKEN_KEY, {
				algorithms: ["HS256"],
				audience: this.AUDIENCE,
			}) as RefreshTokenClaims;
			return r;
		} catch (error) {
			if (error instanceof jwt.TokenExpiredError) {
				return null; // token is expired - treat as invalid
			}
			if (error instanceof jwt.JsonWebTokenError) {
				// if theres any token invalidity like signature is different or the token is malformed
				logger.warn(
					{ token },
					`Invalid refresh token: ${error.message}`,
				); // log the invalid token for debugging - should be safe since these tokens are all invalid to the system
				return null;
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

	public VerifyXsrfToken(token: string, jti: string): boolean {
		// verify the xsrf token by verifying its signature and checking if the jti in its claims matches the given jti
		if (!token) {
			throw new Error("Token is required to verify XSRF token");
		}
		if (!jti) {
			throw new Error("JTI is required to verify XSRF token");
		}
		try {
			const claims = jwt.verify(token, this.XSRF_TOKEN_KEY, {
				algorithms: ["HS256"],
				audience: this.AUDIENCE,
			}) as jwt.JwtPayload;
			return claims.sub === jti; // check if the jti in the claims matches the given jti
		} catch (error) {
			if (error instanceof jwt.TokenExpiredError) {
				return false; // token is expired - treat as invalid
			}
			if (error instanceof jwt.JsonWebTokenError) {
				// if theres any token invalidity like signature is different or the token is malformed
				logger.warn({ token }, `Invalid XSRF token: ${error.message}`); // log the invalid token for debugging - should be safe since these tokens are all invalid to the system
				return false;
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
	private async IsBlocked(jti: string): Promise<boolean> {
		// check if a token is blocklisted - used for refresh tokens
		if (!jti) {
			throw new Error("JTI is required to check if token is blocked");
		}
		try {
			const result = await this.blocklistClient.get(jti);
			return result !== null; // if the result is null, the token is not blocklisted, otherwise it is
		} catch (err) {
			throw new Error(`Error checking if token is blocked`, {
				cause: err,
			});
		}
	}

	/**
	 *
	 * @param jti the unique identifier of the token to block
	 * @param exp the expiration time of the token to block
	 * @description adds a token to the blocklist by addiing its jti to the list of blocked tokens
	 * @throws Error if theres an error during the blocklisting process
	 */
	public async BlockToken(jti: string, exp: Seconds): Promise<Result<null>> {
		// blocklist a token - used for refresh tokens
		// set the blocklist key to expire at the same time as the token - so we don't have to worry about cleaning up expired blocklist entries
		if (!jti) {
			throw new Error("JTI is required to block token");
		}
		if (!exp) {
			throw new Error("Expiration time is required to block token");
		}
		try {
			const ttl = exp - Math.floor(Date.now() / 1000);
			if (ttl <= 0) {
				return [null, new Error("Token is already expired")]; // token is already expired, no need to blocklist
			}
			const r = await this.blocklistClient.set(jti, "blocked", {
				expiration: { type: "EX", value: ttl },
				condition: "NX",
			}); // set the blocklist key to expire at the same time as the token
			if (r === null) {
				return [null, new Error(ErrBlockedToken)]; // token is already blocked
			}
			return [null, null];
		} catch (err) {
			throw new Error(`Error blocking token`, { cause: err });
		}
	}
}
