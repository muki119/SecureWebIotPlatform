import { readFileSync } from "node:fs";

export class ErrNoEnv extends Error {
	constructor(envKey: string) {
		super(
			`Environment variable ${envKey} is required but not set or empty`,
		);
		this.name = "ErrNoEnv";
	}
}

export class PemKeyLoadError extends Error {
	constructor(envKey: string, cause?: Error) {
		super(`Error loading PEM key from environment variable ${envKey}`, {
			cause,
		});
		this.name = "PemKeyLoadError";
	}
}

/**
 *
 * @param key - the environment variable key that has the path to the pem key file
 * @returns string - the PEM key as a string
 * @description - loads the PEM key from the given path and returns it as a string - used for loading the private and public keys for access tokens
 */
export function GetPemKey(key: string): string {
	if (!key) {
		throw new Error("Key is required to load PEM key");
	}
	try {
		const keyPath = GetEnvString(key);
		const keyData = readFileSync(keyPath, "utf-8");
		if (!keyData) {
			throw new PemKeyLoadError(
				key,
				new Error(`PEM key is empty after reading from the file`),
			);
		}
		return keyData;
	} catch (err) {
		if (err instanceof ErrNoEnv || err instanceof PemKeyLoadError) {
			throw err;
		}

		throw new Error(`Error loading PEM key`, { cause: err });
	}
}

export function GetEnvString(key: string, defaultValue?: string): string {
	if (!key) {
		throw new Error("Environment variable key is required");
	}
	const value = process.env[key];
	if (value === undefined || value === "") {
		if (defaultValue !== undefined) {
			return defaultValue;
		}
		throw new ErrNoEnv(key);
	}
	return value;
}

export function GetEnvNumber(key: string, defaultValue?: number): number {
	if (!key) {
		throw new Error("Environment variable key is required");
	}
	const value = GetEnvString(
		key,
		defaultValue !== undefined ? defaultValue.toString() : undefined,
	);
	const num = Number(value);
	if (Number.isNaN(num)) {
		throw new Error(
			`Environment variable ${key} should be a valid number, but got: ${value}`,
		);
	}
	return num;
}
