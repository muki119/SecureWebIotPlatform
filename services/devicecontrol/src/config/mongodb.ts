/**
 * DB config 
 */
import { ConnectToMongoDB } from "@services/common/config"
import { GetEnvString } from "@services/common/utilities"
import { Logger } from "./"

export default ConnectToMongoDB(
    GetEnvString("MONGODB_URI"),
    Logger
)