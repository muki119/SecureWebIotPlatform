import type { Pool, PoolConfig } from "pg";
import type { Logger } from "pino";
import { GetEnvNumber, GetEnvString } from "../utilities/get_env";

export async function ConnectToPostgres(
	config: PoolConfig,
	logger: Logger,
): Promise<Pool> {
	const pg = await import("pg");
	const newConnectionPool = new pg.Pool(config);
	newConnectionPool.on("error", (err) => {
		logger.error({ err }, "Unexpected error on idle postgres client");
		// depending on the error we might want to attempt to reconnect or something - for now just log it
	});
	const ping = async () => {
		try {
			const client = await newConnectionPool.connect();
			client.release();
			logger.info("Connected to Postgres successfully.");
		} catch (err) {
			logger.error({ err }, "Failed to connect to Postgres");
		}
	};
	await ping();

	return newConnectionPool;
}

/**
 * Connects to the service's Postgres instance using the standard `POSTGRES_*`
 * environment variables, falling back to `defaultDatabase` when `POSTGRES_DB`
 * is unset. Pass `overrides` to tweak individual pool options.
 */
export async function ConnectToServicePostgres(
	defaultDatabase: string,
	logger: Logger,
	overrides: PoolConfig = {},
): Promise<Pool> {
	return ConnectToPostgres(
		{
			host: GetEnvString("POSTGRES_HOST", "localhost"),
			port: GetEnvNumber("POSTGRES_PORT", 5432),
			user: GetEnvString("POSTGRES_USER", "postgres"),
			password: GetEnvString("POSTGRES_PASSWORD", ""),
			database: GetEnvString("POSTGRES_DB", defaultDatabase),
			...overrides,
		},
		logger,
	);
}
