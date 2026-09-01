/**
 * DB config
 */
import { ConnectToServiceMongoDB } from "@services/common/config";
import { logger } from "./logger";

export const MongoConnection = await ConnectToServiceMongoDB(logger);
