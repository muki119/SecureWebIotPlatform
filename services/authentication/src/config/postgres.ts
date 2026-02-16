import pg from "pg"
import logger from "./logger"




export function ConnectToPostgres(config: pg.PoolConfig): pg.Pool {
    const newConnectionPool = new pg.Pool(config)
    newConnectionPool.on("error", (err) => {
        logger.error({ err }, "Unexpected error on idle postgres client")
        // depending on the error we might want to attempt to reconnect or something - for now just log it 
    })
    newConnectionPool.on("connect", () => {
        logger.info("Connected to Postgres successfully.")
    })
    return newConnectionPool
}


const defaultConfig: pg.PoolConfig = {
    host: process.env.POSTGRES_HOST || "localhost",
    port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT) : 5432,
    user: process.env.POSTGRES_USER || "auth_service",
    password: process.env.POSTGRES_PASSWORD || "",
    database: process.env.POSTGRES_DB || "authentication_service",
}


export const PostgresPool = ConnectToPostgres(defaultConfig)
