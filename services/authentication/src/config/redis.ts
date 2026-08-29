import { ConnectToServiceRedis } from "@services/common/config";
import logger from "./logger";

export const RedisClient = await ConnectToServiceRedis(logger);
