import type { Request, Response, NextFunction, RequestHandler } from 'express';
import MiddlewareBaseClass from "./middleware_base_class";
import { CreateVerifyAccessTokenInstance } from '../helpers/access_token';
import type { Logger } from "pino"


/**
 * @description Middleware for Session validation
 * Is in class form so that its dependencies can be injected so multiple services can use it 
* 
*  For any service that needs this - need to create an instance passing a pino logger (or whatever loggs with warnings) and pass the middleware function as a middleware
*/

export default class SessionMiddleware extends MiddlewareBaseClass {
    public middleware: RequestHandler;
    constructor(logger: Logger) {
        super(logger);
        this.middleware = this.createMiddleware();
    }
    private createMiddleware() {
        const VerifyAccessTokenInstance = CreateVerifyAccessTokenInstance(this.logger);
        return (req: Request, res: Response, next: NextFunction) => {
            // basically will check access token -- passed in header beaerer token
            const unauthorisedResponse = () => res.status(401).json({ message: "Unauthorised" }).end();
            try {
                const authHeader = req.headers['authorization'];
                if (!authHeader) { // if theres no auth header , some one is trying to access without a token
                    return unauthorisedResponse();
                }
                const token = authHeader.split(' ')[1];
                if (!token || token === "null") { return unauthorisedResponse(); }
                const payload = VerifyAccessTokenInstance(token); // needs the public key to verify 
                if (!payload) { return unauthorisedResponse(); }
                req.user = payload; // this will be used in the controllers to access the users information
                next();
            } catch (error) {
                next(new Error("Cannot Validate Session", { cause: error instanceof Error ? error : undefined }));
            }
        }
    }
}