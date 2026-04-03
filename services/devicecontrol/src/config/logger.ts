import { CreateLogger } from "@services/common/config"
import { GetEnvString } from "@services/common/utilities"
export default CreateLogger({
    host: GetEnvString("LOKI_HOST", "http://localhost:3100"),
    serviceName: "device-control-service",
    logLevel: GetEnvString("LOG_LEVEL", "info"),
})