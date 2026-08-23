import { ErrorHandlerMiddleware } from "@services/common/middleware";
import logger from "../config/logger";

const ErrorHandler = new ErrorHandlerMiddleware(logger).middleware;
export default ErrorHandler;
