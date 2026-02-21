import type { Request, Response, NextFunction } from 'express';
import { VerifyAccessToken } from '../helpers/token_helpers';

export default function ValidSessionMiddleware(req: Request, res: Response, next: NextFunction) {
    // basically will check access token -- passed in header beaerer token
    // check if access token is present in the header
    // passes the payload into request object
    // any errors will be passed to the error handling middleware

    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) { // if theres no auth header , some one is trying to access without a token
            return res.status(401).json({ message: "Unauthorized" });
        }
        const token = authHeader.split(' ')[1];
        if (!token || token === "null") { return res.status(401).json({ message: "Unauthorized" }); }
        const payload = VerifyAccessToken(token);
        if (!payload) { return res.status(401).json({ message: "Unauthorized" }); }
        req.user = payload; // this will be used in the controllers to access the users information
        next();
    } catch (error) {
        next(new Error("Cannot Validate Session", { cause: error instanceof Error ? error : undefined }));
    }
}