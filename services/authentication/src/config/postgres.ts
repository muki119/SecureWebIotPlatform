import pg from "pg"
import logger from "./logger"
import { GetEnvString, GetEnvNumber } from "@services/common/utilities";
import { ConnectToPostgres } from "@services/common/config";

const defaultConfig: pg.PoolConfig = {
    host: GetEnvString("POSTGRES_HOST", "localhost"),
    port: GetEnvNumber("POSTGRES_PORT", 5432),
    user: GetEnvString("POSTGRES_USER", "postgres"),
    password: GetEnvString("POSTGRES_PASSWORD", ""),
    database: GetEnvString("POSTGRES_DB", "authentication_service"),
}


export const PostgresPool = await ConnectToPostgres(defaultConfig, logger)
