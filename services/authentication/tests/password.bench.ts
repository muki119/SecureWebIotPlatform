import { randomInt } from "node:crypto";
import { bench, describe } from "vitest";
import {
	HashPassword,
	PASSWORD_CONSTRAINTS,
	VerifyPassword,
} from "../src/utilities/password_hash";
import { generatePassword, generateRandomPasswords } from "./test_utils";

describe("Benchmarking Password Hashing and Verification", async () => {
	bench(
		"Benchmarking Password Hashing",
		async () => {
			const password = generatePassword(
				randomInt(
					PASSWORD_CONSTRAINTS.minLength,
					PASSWORD_CONSTRAINTS.maxLength,
				),
			);
			await HashPassword(password);
		},
		{ iterations: 1 },
	);

	const randomPasswords = generateRandomPasswords(1000);
	const hashedPasswords = randomPasswords.map(
		async (p) => await HashPassword(p.password),
	);
	bench(
		"Benchmarking Password Verification",
		async () => {
			const i = randomInt(0, randomPasswords.length);

			const password = randomPasswords[i]?.password;
			const hashedPassword = await hashedPasswords[i];
			if (!hashedPassword || !password) {
				throw new Error("Hashed password or password is undefined");
			}
			await VerifyPassword(password, hashedPassword);
		},
		{ time: 1000 },
	);
});
