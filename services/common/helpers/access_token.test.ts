import { generateKeyPairSync } from "node:crypto";
import { CreateVerifyAccessTokenInstance } from "@services/common/helpers";
import jwt from "jsonwebtoken";
import type { Logger } from "pino";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createTestToken = (privateKey: string, audience: string) => {
	return jwt.sign({}, privateKey, {
		algorithm: "RS256",
		audience,
	});
};
describe("CreateVerifyAccessTokenInstance", () => {
	const mockLogger: Partial<Logger> = {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	};

	const { publicKey, privateKey } = generateKeyPairSync("rsa", {
		modulusLength: 2048,
		publicKeyEncoding: {
			type: "spki",
			format: "pem",
		},
		privateKeyEncoding: {
			type: "pkcs8",
			format: "pem",
		},
	});

	const config = {
		audience: "test_audience",
		accessTokenPublicKey: publicKey,
	};

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("should create a verify access token instance with the provided public key and audience", () => {
		const verifyAccessToken = CreateVerifyAccessTokenInstance(
			mockLogger as Logger,
			config.accessTokenPublicKey,
			config.audience,
		);
		expect(verifyAccessToken).toBeDefined();
	});

	it("should return claims for a valid token", () => {
		const verifyAccessToken = CreateVerifyAccessTokenInstance(
			mockLogger as Logger,
			config.accessTokenPublicKey,
			config.audience,
		);
		const token = createTestToken(privateKey, config.audience);
		const [claims, error] = verifyAccessToken(token);
		expect(claims).toBeDefined();
		expect(error).toBeNull();
	});

	it("should return an error for an invalid token", () => {
		const verifyAccessToken = CreateVerifyAccessTokenInstance(
			mockLogger as Logger,
			config.accessTokenPublicKey,
			config.audience,
		);
		const [claims, error] = verifyAccessToken("invalid_token");
		expect(claims).toBeNull();
		expect(error).toBeDefined();
	});

	it("should return an error for an expired token", () => {
		const verifyAccessToken = CreateVerifyAccessTokenInstance(
			mockLogger as Logger,
			config.accessTokenPublicKey,
			config.audience,
		);
		const expiredToken = jwt.sign({}, privateKey, {
			algorithm: "RS256",
			audience: config.audience,
			expiresIn: -1, // token is already expired
		});
		const [claims, error] = verifyAccessToken(expiredToken);
		expect(claims).toBeNull();
		expect(error).toBeDefined();
		expect(error?.message).toBe("Token has expired");
	});

	it("should throw an error if no token is provided", () => {
		const verifyAccessToken = CreateVerifyAccessTokenInstance(
			mockLogger as Logger,
			config.accessTokenPublicKey,
			config.audience,
		);
		const [claims, error] = verifyAccessToken("");
		expect(claims).toBeNull();
		expect(error).toBeDefined();
		expect(error?.message).toBe("No token provided");
	});

	it("should throw an error if the public key is invalid", () => {
		const invalidPublicKey = "invalid_public_key";
		const verifyAccessToken = CreateVerifyAccessTokenInstance(
			mockLogger as Logger,
			invalidPublicKey,
			config.audience,
		);
		const token = createTestToken(privateKey, config.audience);
		const [t, err] = verifyAccessToken(token);
		expect(t).toBeNull();
		expect(err).toBeDefined();
		expect(err?.message).toBe("Invalid Access token");
	});

	it("should throw an error if the audience is invalid", () => {
		const verifyAccessToken = CreateVerifyAccessTokenInstance(
			mockLogger as Logger,
			config.accessTokenPublicKey,
			"invalid_audience",
		);
		const token = createTestToken(privateKey, config.audience);
		const [t, err] = verifyAccessToken(token);
		expect(t).toBeNull();
		expect(err).toBeDefined();
		expect(err?.message).toBe("Invalid Access token");
	});

	it("should throw if the public key is not part of the pair used to sign the token", () => {
		const { publicKey: otherPublicKey } = generateKeyPairSync("rsa", {
			modulusLength: 2048,
			publicKeyEncoding: {
				type: "spki",
				format: "pem",
			},
			privateKeyEncoding: {
				type: "pkcs8",
				format: "pem",
			},
		});

		const verifyAccessToken = CreateVerifyAccessTokenInstance(
			mockLogger as Logger,
			otherPublicKey,
			config.audience,
		);
		const token = createTestToken(privateKey, config.audience); // signed with the original private key
		const [t, err] = verifyAccessToken(token);
		expect(t).toBeNull();
		expect(err).toBeDefined();
		expect(err?.message).toBe("Invalid Access token");
	});
});
