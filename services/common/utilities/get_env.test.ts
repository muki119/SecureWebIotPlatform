import {
    ErrNoEnv,
    GetEnvNumber,
    GetEnvString,
    GetPemKey,
    PemKeyLoadError,
} from "@services/common/utilities";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = process.env;

describe("GetEnvString", () => {
    beforeEach(() => {
        process.env = { ...ORIGINAL_ENV };
    });

    afterEach(() => {
        process.env = ORIGINAL_ENV;
    });

    it("should return the environment variable as a string", () => {
        process.env.TEST_VAR = "test_value";
        expect(GetEnvString("TEST_VAR")).toBe("test_value");
    });

    it("should throw an error if the environment variable is not set", () => {
        delete process.env.TEST_VAR;
        expect(() => GetEnvString("TEST_VAR")).toThrow(ErrNoEnv);
    });

    it("should return the default value if the environment variable is not set and a default value is provided", () => {
        delete process.env.TEST_VAR;
        expect(GetEnvString("TEST_VAR", "default_value")).toBe("default_value");
    });

    it("should throw if there is no value and no default value is provided", () => {
        delete process.env.TEST_VAR;
        expect(() => GetEnvString("TEST_VAR")).toThrow(
            "Environment variable TEST_VAR is required but not set or empty",
        );
    });

    it("should throw an error if the environment variable is set to an empty string", () => {
        process.env.TEST_VAR = "";
        expect(() => GetEnvString("TEST_VAR")).toThrow(ErrNoEnv);
    });

    it("should throw an error if the environment variable key is not provided", () => {
        expect(() => GetEnvString("")).toThrow(
            "Environment variable key is required",
        );
    });

    it("should prefer environment variable over default value if both are provided", () => {
        process.env.TEST_VAR = "env_value";
        expect(GetEnvString("TEST_VAR", "default_value")).toBe("env_value");
    });
});

describe("GetEnvNumber", () => {
    beforeEach(() => {
        process.env = { ...ORIGINAL_ENV };
    });

    afterEach(() => {
        process.env = ORIGINAL_ENV;
    });

    it("should return the environment variable as a number", () => {
        process.env.TEST_VAR = "42";
        expect(GetEnvNumber("TEST_VAR")).toBe(42);
    });

    it("should throw an error if the environment variable is not set", () => {
        delete process.env.TEST_VAR;
        expect(() => GetEnvNumber("TEST_VAR")).toThrow(ErrNoEnv);
    });

    it("should return the default value if the environment variable is not set and a default value is provided", () => {
        delete process.env.TEST_VAR;
        expect(GetEnvNumber("TEST_VAR", 100)).toBe(100);
    });

    it("should throw if there is no value and no default value is provided", () => {
        delete process.env.TEST_VAR;
        expect(() => GetEnvNumber("TEST_VAR")).toThrow(
            "Environment variable TEST_VAR is required but not set or empty",
        );
    });

    it("should throw an error if the environment variable is not a valid number", () => {
        process.env.TEST_VAR = "not_a_number";
        expect(() => GetEnvNumber("TEST_VAR")).toThrow(
            "Environment variable TEST_VAR should be a valid number, but got: not_a_number",
        );
    });

    it("should throw an error if the environment variable is set to an empty string", () => {
        process.env.TEST_VAR = "";
        expect(() => GetEnvNumber("TEST_VAR")).toThrow(ErrNoEnv);
    });

    it("should throw an error if the environment variable key is not provided", () => {
        expect(() => GetEnvNumber("")).toThrow(
            "Environment variable key is required",
        );
    });

    it("should prefer environment variable over default value if both are provided", () => {
        process.env.TEST_VAR = "50";
        expect(GetEnvNumber("TEST_VAR", 100)).toBe(50);
    });
});

vi.mock("node:fs", () => ({
    readFileSync: vi.fn((path: string) => {
        if (path === "valid_path") {
            return "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----";
        } else if (path === "empty_path") {
            return "";
        } else {
            throw new Error("File not found");
        }
    }),
}));

describe("GetPemKey", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });
    beforeEach(() => {
        process.env = { ...ORIGINAL_ENV };
    });

    it("should return the PEM key as a string when the path is valid", () => {
        process.env.PEM_KEY_PATH = "valid_path";
        expect(GetPemKey("PEM_KEY_PATH")).toBe(
            "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
        );
    });

    it("should throw an error when the path is invalid", () => {
        process.env.PEM_KEY_PATH = "invalid_path";
        expect(() => GetPemKey("PEM_KEY_PATH")).toThrow(Error);
    });

    it("should throw an error when the environment variable is not set", () => {
        delete process.env.PEM_KEY_PATH;
        expect(() => GetPemKey("PEM_KEY_PATH")).toThrow(ErrNoEnv);
    });

    it("should throw an error when the environment variable is set to an empty string", () => {
        process.env.PEM_KEY_PATH = "";
        expect(() => GetPemKey("PEM_KEY_PATH")).toThrow(ErrNoEnv);
    });

    it("should throw an error if the environment variable key is not provided", () => {
        expect(() => GetPemKey("")).toThrow("Key is required to load PEM key");
    });

    it("should throw an error if PEM key is empty after reading from the file", () => {
        process.env.PEM_KEY_PATH = "empty_path";
        expect(() => GetPemKey("PEM_KEY_PATH")).toThrow(PemKeyLoadError);
    });
});
