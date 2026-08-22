import { ConnectToPostgres } from "@services/common/config";
import { GetEnvNumber, GetEnvString } from "@services/common/utilities";
import type { PoolConfig } from "pg";
import logger from "./logger";

const defaultConfig: PoolConfig = {
	host: GetEnvString("POSTGRES_HOST", "localhost"),
	port: GetEnvNumber("POSTGRES_PORT", 5432),
	user: GetEnvString("POSTGRES_USER", "postgres"),
	password: GetEnvString("POSTGRES_PASSWORD", ""),
	database: GetEnvString("POSTGRES_DB", "authentication_service"),
};

export const PostgresPool = await ConnectToPostgres(defaultConfig, logger);
