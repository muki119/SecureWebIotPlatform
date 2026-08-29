import { ConnectToServiceRedis } from "@services/common/config";
import { logger } from "./";

export const RedisClient = await ConnectToServiceRedis(logger);
