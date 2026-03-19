import { hostname } from "os";
import pino from "pino";
import { GetEnvString } from "@services/common/utilities";
import { type ILoggerOptions, CreateLogger } from "@services/common/config";
import { pid } from "process";


const options: ILoggerOptions = {
    host: GetEnvString("LOKI_HOST", "http://localhost:3100"),
    serviceName: "authentication-service",
    logLevel: GetEnvString("LOG_LEVEL", "info")
}
export default CreateLogger(options);