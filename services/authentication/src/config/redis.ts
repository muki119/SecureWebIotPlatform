import { createClientPool } from 'redis';
import logger from './logger';
import { GetEnvString, GetEnvNumber } from "@services/common/utilities";


export interface RedisConfig {
    host: string;
    port: number;
    password: string;
    db: number;
}

export function ConnectToRedis(config: RedisConfig) {
    try {
        const client = createClientPool({
            socket: {
                host: config.host,
                port: config.port,
            },
            password: config.password,
            database: config.db,
        });
        client.on("error", (err) => logger.error("Redis Client Error", err));
        client.connect().then(() => {
            logger.info("Connected to Redis successfully.");
        }).catch((error) => {
            throw new Error(`Error While attempting to connect to Redis: ${error}`);
        });
        return client;
    } catch (error) {
        throw new Error(`Unable to connect to Redis: ${error}`);
    }
}

export const RedisClient = ConnectToRedis({
    host: GetEnvString("REDIS_HOST", "localhost"),
    port: GetEnvNumber("REDIS_PORT", 6379),
    password: GetEnvString("REDIS_PASSWORD", ""), // add password if needed
    db: GetEnvNumber("REDIS_DB", 0),
});