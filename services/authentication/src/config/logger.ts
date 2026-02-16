import { hostname } from "os";
import pino from "pino";

const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    base: { service: "authentication-service", hostname: hostname() },
    timestamp: pino.stdTimeFunctions.isoTime,
})


export default logger;