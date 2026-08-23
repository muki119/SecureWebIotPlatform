import { describe, expect, test } from "vitest";
import {
	CODE_LENGTH,
	GeneratePairingCode,
	VerifyPairingCode,
} from "../src/helpers/generate_pairing_code";

describe("Generate Pairing Code", () => {
	test("Generated code should be valid", async () => {
		const code = await GeneratePairingCode();
		expect(VerifyPairingCode(code)).toBe(true);
	});
});

describe("Verify Pairing Code", () => {
	test("Valid code should return true", async () => {
		const code = await GeneratePairingCode();
		expect(VerifyPairingCode(code)).toBe(true);
	});

	test("Incremental code should return false", () => {
		const incrementalCode = "123456";
		expect(VerifyPairingCode(incrementalCode)).toBe(false);
	});
	test("Decremental code should return false", () => {
		const decrementalCode = "654321";
		expect(VerifyPairingCode(decrementalCode)).toBe(false);
	});
	test("Code with 3 repeating characters should return false", () => {
		const repeatingCode = "111234";
		expect(VerifyPairingCode(repeatingCode)).toBe(false);
	});
	test("Code with 3 repeating characters in the middle should return false", () => {
		const repeatingCode = "123333";
		expect(VerifyPairingCode(repeatingCode)).toBe(false);
	});
	test("Code with 3 repeating characters at the end should return false", () => {
		const repeatingCode = "123444";
		expect(VerifyPairingCode(repeatingCode)).toBe(false);
	});
	test("Returns true when code only has 2 repeating characters", () => {
		const repeatingCode = "112345";
		expect(VerifyPairingCode(repeatingCode)).toBe(true);
	});
	test("Returns false when code is non string", () => {
		// @ts-expect-error
		expect(VerifyPairingCode(123456)).toBe(false);
	});
	test("Returns false when code is empty string", () => {
		expect(VerifyPairingCode("")).toBe(false);
	});
	test("Returns false when code is invalid length", async () => {
		const shortCode = await GeneratePairingCode(CODE_LENGTH - 2); // supposed to be at least smaller than the default code length
		const longCode = await GeneratePairingCode(CODE_LENGTH + 2); // has to be multiple of 2 because of hex
		expect(VerifyPairingCode(shortCode)).toBe(false);
		expect(VerifyPairingCode(longCode)).toBe(false);
	});
});
