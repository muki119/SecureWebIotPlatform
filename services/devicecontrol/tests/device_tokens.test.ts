import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CapabilityTypes, IDevice } from "../src/types";

const mockLogger = {
	warn: vi.fn(),
};

vi.mock("../src/config", () => ({
	logger: mockLogger,
}));

const { CreateDeviceToken, VerifyDeviceToken } = await import(
	"../src/helpers/device_tokens"
);

const ORIGINAL_ENV = process.env;
const TOKEN_SECRET = "test-device-token-secret";
const device: IDevice = {
	id: "device-id",
	name: "Test device",
	domainId: "domain-id",
	createdBy: "user-id",
	currentState: {},
	capabilities: {
		power: {
			label: "Power",
			type: "BINARY" as CapabilityTypes.BINARY,
			metric: "state",
		},
	},
	createdAt: new Date(),
	deletedAt: null,
};

describe("device tokens", () => {
	beforeEach(() => {
		process.env = {
			...ORIGINAL_ENV,
			DEVICE_TOKEN_SECRET_KEY: TOKEN_SECRET,
		};
		vi.clearAllMocks();
	});

	afterEach(() => {
		process.env = ORIGINAL_ENV;
	});

	it("creates a token with the device claims", () => {
		const token = CreateDeviceToken(device);
		const [claims, error] = VerifyDeviceToken(token);

		expect(error).toBeNull();
		expect(claims).toMatchObject({
			sub: device.id,
			aud: device.domainId,
			iss: "device-control",
			capabilities: {
				power: {
					label: "Power",
					type: "BINARY",
					metric: "state",
				},
			},
		});
	});

	it("should return an invalid-token error and logs when verification fails", () => {
		const [claims, error] = VerifyDeviceToken("invalid-token");

		expect(claims).toBeNull();
		expect(error).toHaveProperty("message", "Invalid token");
		expect(mockLogger.warn).toHaveBeenCalledOnce();
	});

	it("should wrap token creation errors when the secret is missing", () => {
		delete process.env.DEVICE_TOKEN_SECRET_KEY;

		expect(() => CreateDeviceToken(device)).toThrow(
			"Error creating device token",
		);
	});
});
