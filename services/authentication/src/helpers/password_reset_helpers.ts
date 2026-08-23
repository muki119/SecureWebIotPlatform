import { randomBytes } from "node:crypto";
import { RedisClient } from "../config/redis"; // going to use this client for the time being  - should only really be for blocklist

// has redis client to set and get tokens for password reset

const RESET_TOKEN_LENGTH = 32;
const RESET_TOKEN_TTL_MS = 60 * 5 * 1000; // only 5 mins to redeem

const TOKEN_TO_USERID = "password-reset-userid"; // used to find the userid for a given token - "the userid for this token is... "
const USERID_TO_TOKEN = "password-reset-token"; // used to find the token for a given userid  - "the token for this userid is... "

export type ResetToken = string;

/**
 *
 * @returns a cryptographically secure , randomly generated reset token string
 */
function generateResetToken(): ResetToken {
	return randomBytes(RESET_TOKEN_LENGTH).toString("base64url");
}

/**
 *
 * @param userId - the user id to create a password reset token for
 * @description - creates a password reset token for a given user id - invalidates any pre-existing tokens before creating a new token
 * @returns - ResetToken - the rest token for the given user id
 * @throws error if there is a problem while interacting with redis to create the token
 */
export async function CreateResetToken(userId: string): Promise<ResetToken> {
	// should also probably check if theres already one for this userid
	const token = generateResetToken();
	try {
		await InvalidateResetToken(userId); // invalidate any existing tokens for this user - enforce one token at a time
		await RedisClient.set(`${TOKEN_TO_USERID}:${token}`, userId, {
			expiration: { type: "PX", value: RESET_TOKEN_TTL_MS },
		});
		await RedisClient.set(`${USERID_TO_TOKEN}:${userId}`, token, {
			expiration: { type: "PX", value: RESET_TOKEN_TTL_MS },
		});
	} catch (err) {
		throw new Error("Error creating reset token", { cause: err });
	}
	// store regular index and reverse index to enforce one token at a time
	return token;
}

/**
 *
 * @param token - the reset token to verify
 * @returns the user id associated to the token if valid - otherwisee null
 * @throws error if there is an issue while fetching from redis
 */
export async function VerifyResetToken(
	token: ResetToken,
): Promise<string | null> {
	try {
		const userId = await RedisClient.get(`${TOKEN_TO_USERID}:${token}`);
		return userId;
	} catch (err) {
		throw new Error("Error verifying reset token", { cause: err });
	}
}

/**
 *
 * @param userId - the userId to invalidate any tokens associated with it
 * @throws error if there is an issue while interacting with redis
 * @description - invalidates any existing reset tokens for a given userid
 */
export async function InvalidateResetToken(userId: string) {
	// basically find the token corresponding to the userid and delete it
	try {
		const token = await RedisClient.get(`${USERID_TO_TOKEN}:${userId}`); // find the token for the user id
		if (token) {
			// if it exists
			await RedisClient.del(`${TOKEN_TO_USERID}:${token}`); // delete the token - could soft delete - for logging attempts
			await RedisClient.del(`${USERID_TO_TOKEN}:${userId}`); // delete the reverse index
			return;
		}
	} catch (err) {
		throw new Error("Error invalidating reset token", { cause: err });
	}
}
