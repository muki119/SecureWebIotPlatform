import { ConnectToRedis } from "@services/common/config";
import { GetEnvNumber, GetEnvString } from "@services/common/utilities";
import logger from "./logger";

export const RedisClient = await ConnectToRedis(
	{
		host: GetEnvString("REDIS_HOST", "localhost"),
		port: GetEnvNumber("REDIS_PORT", 6379),
		password: GetEnvString("REDIS_PASSWORD", ""), // add password if needed
		db: GetEnvNumber("REDIS_DB", 0),
	},
	logger,
);
