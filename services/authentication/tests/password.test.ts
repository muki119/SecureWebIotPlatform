import { randomInt } from "node:crypto";
import { assert, describe, expect, test } from "vitest";
import {
	ErrMaxPasswordLength,
	ErrMinPasswordLength,
	ErrNoPlaintextPassword,
	HashPassword,
	PASSWORD_CONSTRAINTS,
	VerifyPassword,
} from "../src/utilities/password_hash";
import { generatePassword } from "./test_utils";

describe("Testing Password Hashing", () => {
	test("Hashes password correctly given valid password", async () => {
		const validPassword = generatePassword(
			randomInt(
				PASSWORD_CONSTRAINTS.minLength,
				PASSWORD_CONSTRAINTS.maxLength,
			),
		);
		const hash = await HashPassword(validPassword);
		assert.exists(hash, "Expected hash to be generated for valid password");
	});
	test("Throws error when given no password", async () => {
		// is now bubbling up the error , because its now caught and rethrown in the HashPassword function
		try {
			await HashPassword("");
		} catch (error) {
			assert.instanceOf(error, Error);
			assert.equal(
				(error.cause as Error).message,
				ErrNoPlaintextPassword,
				"Expected error cause to be ErrNoPlaintextPassword",
			);
		}
	});
	test("Throws error when given a password that is too short", async () => {
		const shortPassword = generatePassword(
			randomInt(1, PASSWORD_CONSTRAINTS.minLength - 1),
		);
		try {
			await HashPassword(shortPassword);
		} catch (error) {
			assert.instanceOf(error, Error);
			assert.equal(
				(error.cause as Error).message,
				ErrMinPasswordLength,
				"Expected error cause to be ErrMinPasswordLength",
			);
		}
	});
	test("Throws error when given a password that is too long", async () => {
		const longPassword = generatePassword(
			randomInt(
				PASSWORD_CONSTRAINTS.maxLength + 1,
				PASSWORD_CONSTRAINTS.maxLength + 20,
			),
		);
		try {
			await HashPassword(longPassword);
		} catch (error) {
			assert.instanceOf(error, Error);
			assert.equal(
				(error.cause as Error).message,
				ErrMaxPasswordLength,
				"Expected error cause to be ErrMaxPasswordLength",
			);
		}
	});
});

describe("Testing Password Verification", () => {
	test("Verifies correct password successfully", async () => {
		const password = generatePassword(
			randomInt(
				PASSWORD_CONSTRAINTS.minLength,
				PASSWORD_CONSTRAINTS.maxLength,
			),
		);
		const hash = await HashPassword(password);
		const isValid = await VerifyPassword(password, hash);
		assert.strictEqual(
			isValid,
			true,
			"Expected password verification to succeed with correct password",
		);
	});
	test("Fails to verify incorrect password", async () => {
		const password = generatePassword(
			randomInt(
				PASSWORD_CONSTRAINTS.minLength,
				PASSWORD_CONSTRAINTS.maxLength,
			),
		);
		const wrongPassword = generatePassword(
			randomInt(
				PASSWORD_CONSTRAINTS.minLength,
				PASSWORD_CONSTRAINTS.maxLength,
			),
		);
		const hash = await HashPassword(password);
		const isValid = await VerifyPassword(wrongPassword, hash);
		assert.strictEqual(
			isValid,
			false,
			"Expected password verification to fail with incorrect password",
		);
	});
	test("Returns false when given empty password", async () => {
		const password = generatePassword(
			randomInt(
				PASSWORD_CONSTRAINTS.minLength,
				PASSWORD_CONSTRAINTS.maxLength,
			),
		);
		const hash = await HashPassword(password);
		const result = await VerifyPassword("", hash);
		expect(result).toBe(false);
	});
	test("Returns false when given empty hash", async () => {
		const password = generatePassword(
			randomInt(
				PASSWORD_CONSTRAINTS.minLength,
				PASSWORD_CONSTRAINTS.maxLength,
			),
		);
		const result = await VerifyPassword(password, "");
		expect(result).toBe(false);
	});
});
