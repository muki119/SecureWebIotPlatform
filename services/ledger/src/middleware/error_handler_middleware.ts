import { ErrorHandlerMiddleware } from "@services/common/middleware";
import { logger } from "../config";
export const ErrorHandler = new ErrorHandlerMiddleware(logger).middleware;
