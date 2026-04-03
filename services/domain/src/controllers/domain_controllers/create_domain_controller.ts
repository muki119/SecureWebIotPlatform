import type { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import { CreateDomainService } from '../../services';
import { LogWarningDefault } from '@services/common/utilities';

export default async function CreateDomainController(req: Request, res: Response, next: NextFunction) {
    try {
        // the domain model will create a new domain , join table entry and user role entry
        const { domainName } = req.body;
        const userID = req.user?.sub; // should be set by the auth middleware
        if (!domainName) {
            return res.status(400).json({ error: "Domain name is required" }).end();
        }
        if (!userID) { // somehow got past the auth middleware
            logger.warn(LogWarningDefault(req), "Unauthorized access to CreateDomainController - no user ID in request");
            return res.status(401).json({ error: "Unauthorized" }).end();
        }
        const [result, error] = await CreateDomainService(domainName, userID)
        if (error) {
            logger.warn({ ...LogWarningDefault(req), error }, "Error in CreateDomainController: ")
            return res.status(400).json({ error }).end();
        }
        return res.status(201).json(result).end();
    } catch (error) {
        next(new Error("Failed to create domain", { cause: error }));
    }
}