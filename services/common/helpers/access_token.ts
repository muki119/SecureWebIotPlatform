import jwt from "jsonwebtoken";
import type { Logger } from "pino";
import type { AccessTokenClaims, Result } from "../types";
import { GetEnvString, GetPemKey } from "../utilities/get_env";
/**
 *
 * @param logger - a pino logger instance to log any errors that may occur during verification
 * @description factory function for creating a verify access token instance that uses the provided logger to log any errors that may occur during verification
 * @requires ACCESS_TOKEN_PUBLIC_KEY_PATH and TOKEN_AUDIENCE to be set in the environment variables
 * @throws Error if theres an error during verification that isnt related to token invalidity or expiration
 * @returns
 */
export function CreateVerifyAccessTokenInstance(
	_logger: Logger,
	accessTokenPublicKey?: string,
	audience?: string,
) {
	// have to make a factory function because the logger may have different configurations - but will all be a pino instance anyway
	/**
	 * @param token  - the accress token to verify
	 * @returns the claims of the token if it is valid, otherwise null - will return null if the token is expired or invalid for any reason
	 * @description verifies an access token and returns the claims if it is valid, otherwise returns null - will return null if the token is expired or invalid for any reason
	 * @throws Error if theres an error during verification that isnt related to token invalidity or expiration
	 */
	return (token: string): Result<AccessTokenClaims> => {
		if (!token) {
			return [null, new Error("No token provided")]; // if theres no token then just treat it as invalid and return null
		}
		try {
			const ACCESS_TOKEN_PUBLIC_KEY =
				accessTokenPublicKey ||
				GetPemKey("ACCESS_TOKEN_PUBLIC_KEY_PATH"); //  for verifying access tokens
			const AUDIENCE = GetEnvString("TOKEN_AUDIENCE", audience);
			const r = jwt.verify(token, ACCESS_TOKEN_PUBLIC_KEY, {
				algorithms: ["RS256"],
				audience: AUDIENCE,
			}) as AccessTokenClaims;
			return [r, null];
		} catch (error) {
			if (error instanceof jwt.TokenExpiredError) {
				return [null, new Error("Token has expired")]; // token is expired - treat as invalid
			}
			if (error instanceof jwt.JsonWebTokenError) {
				// if theres any token invalidity like signature is different or the token is malformed
				return [
					null,
					new Error(`Invalid Access token`, { cause: error }),
				];
			}
			throw new Error(`Error verifying access token`, { cause: error });
		}
	};
}
