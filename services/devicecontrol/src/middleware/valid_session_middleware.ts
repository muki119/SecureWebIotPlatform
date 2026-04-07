import { SessionMiddleware } from '@services/common/middleware';
import logger from '../config/logger';
export const ValidSessionMiddleware = new SessionMiddleware(logger).middleware;