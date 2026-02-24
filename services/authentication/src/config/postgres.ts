import pg from "pg"
import logger from "./logger"
import { GetEnvString, GetEnvNumber } from "@services/common/utilities";




export function ConnectToPostgres(config: pg.PoolConfig): pg.Pool {
    const newConnectionPool = new pg.Pool(config)
    newConnectionPool.on("error", (err) => {
        logger.error({ err }, "Unexpected error on idle postgres client")
        // depending on the error we might want to attempt to reconnect or something - for now just log it 
    })
    const ping = async () => {
        try {
            const client = await newConnectionPool.connect();
            client.release();
            logger.info("Connected to Postgres successfully.");
        } catch (err) {
            logger.error({ err }, "Failed to connect to Postgres");
        }
    }
    ping();

    return newConnectionPool
}


const defaultConfig: pg.PoolConfig = {
    host: GetEnvString("POSTGRES_HOST", "localhost"),
    port: GetEnvNumber("POSTGRES_PORT", 5432),
    user: GetEnvString("POSTGRES_USER", "postgres"),
    password: GetEnvString("POSTGRES_PASSWORD", ""),
    database: GetEnvString("POSTGRES_DB", "authentication_service"),
}


export const PostgresPool = ConnectToPostgres(defaultConfig)
