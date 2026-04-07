import type { Request, Response, NextFunction } from 'express';
import { logger } from "../config";
import { ErrorHandlerMiddleware } from '@services/common/middleware';
export const ErrorHandler = new ErrorHandlerMiddleware(logger).middleware;
