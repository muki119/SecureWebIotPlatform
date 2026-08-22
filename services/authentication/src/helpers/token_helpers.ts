import { GetEnvString, GetPemKey } from "@services/common/utilities";
import { RedisClient } from "../config/redis";
import { TokenBundle } from "./token_bundle";

// going to need the redis client for a blocklist - for refresh tokens , no need for access tokens since they are short lived and we can just wait for them to expire

const ACCESS_TOKEN_PRIVATE_KEY = GetPemKey("ACCESS_TOKEN_PRIVATE_KEY_PATH"); // load a pem file - no need for public since
const XSRF_TOKEN_KEY = GetEnvString("XSRF_TOKEN_KEY"); // process.env.XSRF_TOKEN_KEY || ""
const REFRESH_TOKEN_KEY = GetEnvString("REFRESH_TOKEN_KEY"); // symmetric key since only the auth service will access and verify it
const AUDIENCE = GetEnvString("TOKEN_AUDIENCE", "SecureWebIotPlatform"); // the audience for the tokens - can be used to verify that the token is intended for this service
const ACCESS_TOKEN_EXPIRATION = 15 * 60; // access tokens expire in 15 minutes - in seconds

export const TokenBundleInstance = new TokenBundle({
	accessTokenPrivateKey: ACCESS_TOKEN_PRIVATE_KEY,
	xsrfTokenKey: XSRF_TOKEN_KEY,
	refreshTokenKey: REFRESH_TOKEN_KEY,
	audience: AUDIENCE,
	accessTokenExpiration: ACCESS_TOKEN_EXPIRATION,
	blocklistClient: RedisClient,
});
