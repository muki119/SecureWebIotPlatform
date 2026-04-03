import type { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { ErrorHandlerMiddleware } from '@services/common/middleware';
const ErrorHandler = new ErrorHandlerMiddleware(logger).middleware;
export default ErrorHandler;