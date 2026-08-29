import { GenerateRandomBytes } from "@services/common/utilities";
import { describe, expect, it } from "vitest";

describe("GenerateRandomBytes", async () => {
	it("should generate a random byte array of the specified length", async () => {
		const length = 16;
		const randomBytes = await GenerateRandomBytes(length);
		expect(randomBytes).toBeInstanceOf(Uint8Array);
		expect(randomBytes.length).toBe(length);
	});

	it("should generate different random byte arrays on subsequent calls", async () => {
		const length = 16;
		const randomBytes1 = await GenerateRandomBytes(length);
		const randomBytes2 = await GenerateRandomBytes(length);
		expect(randomBytes1).not.toEqual(randomBytes2);
	});

	it("should throw an error if the length is not a positive integer", async () => {
		await expect(async () => await GenerateRandomBytes(0)).rejects.toThrow(
			"Length must be a positive integer",
		);
		await expect(async () => await GenerateRandomBytes(-1)).rejects.toThrow(
			"Length must be a positive integer",
		);
		await expect(
			async () => await GenerateRandomBytes(3.5),
		).rejects.toThrow("Length must be a positive integer");
	});
});
