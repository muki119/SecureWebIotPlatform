import MiddlewareBaseClass from "./middleware_base_class";
import type { Request, Response, NextFunction } from 'express';
import { RecursiveError } from '@services/common/utilities';

export default class ErrorHandlerMiddleware extends MiddlewareBaseClass {
    constructor(logger: any) {
        super(logger);
    }
    middleware = (err: Error, req: Request, res: Response, next: NextFunction) => {

        const isSyntaxError = err instanceof SyntaxError && 'body' in err; // if its a body parser error 

        const errorContext = {
            route: req.route?.path || req.url,
            method: req.method,
            user_agent: req.headers['user-agent'],
            error: {
                name: err.name, // to get the type of error (e.g. SyntaxError, TypeError, etc.)
                message: isSyntaxError ? "Invalid JSON payload" : err.message,
                stack: isSyntaxError ? undefined : err.stack, // because syntax errors can contain the entire request body in the stack trace, which can contain sensitive info
                cause: err.cause ? RecursiveError(err.cause as Error) : undefined,
            }
        }

        if (isSyntaxError) {
            this.logger.warn(errorContext, "Syntax error in request body")
            return res.status(400).json({ error: 'Invalid JSON payload' }).end();
        }
        this.logger.error(errorContext, "An error occurred while processing the request")
        return res.status(500).json({ error: 'Internal Server Error' }).end();
    }
}