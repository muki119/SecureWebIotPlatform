import { CreateLogger, type ILoggerOptions } from "@services/common/config";
import { GetEnvString } from "../../../common/utilities/getEnv";

const options: ILoggerOptions = {
    host: GetEnvString("LOKI_HOST", "http://localhost:3100"),
    serviceName: "domain-service",
    logLevel: GetEnvString("LOG_LEVEL", "info")
}
export default CreateLogger(options);