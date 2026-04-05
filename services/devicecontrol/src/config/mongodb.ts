/**
 * DB config 
 */
import { ConnectToMongoDB } from "@services/common/config"
import { GetEnvString } from "@services/common/utilities"
import { logger } from "./"

export default await ConnectToMongoDB(
    GetEnvString("MONGODB_URI"),
    logger
)