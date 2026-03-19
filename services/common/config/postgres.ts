import pg from "pg"
export function ConnectToPostgres(config: pg.PoolConfig, logger: any): pg.Pool {
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