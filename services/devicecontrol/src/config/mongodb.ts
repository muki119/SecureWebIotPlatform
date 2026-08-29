/**
 * DB config
 */
import { ConnectToServiceMongoDB } from "@services/common/config";
import { logger } from "./";

export const MongoConnection = await ConnectToServiceMongoDB(logger);
