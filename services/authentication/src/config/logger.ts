import { hostname } from "os";
import pino from "pino";
import { pid } from "process";

const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    base: { service: "authentication-service", hostname: hostname(), pid: pid },
    timestamp: pino.stdTimeFunctions.isoTime,
})


export default logger;