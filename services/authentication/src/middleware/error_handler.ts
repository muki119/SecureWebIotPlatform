import type { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export default function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    // i think error should also have the function name where it was thrown

    const isSyntaxError = err instanceof SyntaxError && 'body' in err; // if its a body parser error 

    const errorContext = {
        route: req.route?.path || req.url,
        method: req.method,
        user_agent: req.headers['user-agent'],
        error: {
            name: err.name, // to get the type of error (e.g. SyntaxError, TypeError, etc.)
            message: isSyntaxError ? "Invalid JSON payload" : err.message,
            stack: isSyntaxError ? undefined : err.stack, // because syntax errors can contain the entire request body in the stack trace, which can contain sensitive info
            cause: err.cause ? {
                name: (err.cause as Error).name,
                message: (err.cause as Error).message,
            } : undefined
        }
    }

    if (isSyntaxError) {
        logger.warn(errorContext, "Syntax error in request body")
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    logger.error(errorContext, "An error occurred while processing the request")
    res.status(500).json({ error: 'Internal Server Error' });
}