import { ConnectToRedis } from '@services/common/config';
import logger from './logger';
import { GetEnvString, GetEnvNumber } from "@services/common/utilities";

export const RedisClient = ConnectToRedis({
    host: GetEnvString("REDIS_HOST", "localhost"),
    port: GetEnvNumber("REDIS_PORT", 6379),
    password: GetEnvString("REDIS_PASSWORD", ""), // add password if needed
    db: GetEnvNumber("REDIS_DB", 0),
}, logger);