import { SessionMiddleware } from '@services/common/middleware';
import { logger } from '../config/';
export const ValidSessionMiddleware = new SessionMiddleware(logger).middleware;