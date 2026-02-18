import type { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export default function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    // i think error should also have the function name where it was thrown
    logger.error({ route: req.route?.path || req.url, err }, "An error occurred while processing the request")
    res.status(500).json({ error: 'Internal Server Error' });
}