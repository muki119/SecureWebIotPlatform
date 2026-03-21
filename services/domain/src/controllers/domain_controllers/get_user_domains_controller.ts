import type { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import { LogWarningDefault } from '@services/common/utilities';
import { GetUserDomainsService } from "../../services"
export default async function GetUserDomainsController(req: Request, res: Response, next: NextFunction) {
    // gets all the users domains
    // paginated with a limit of 50
    // join table opperations to get domainsid, and name - further details will be requested on click
    // default offset is 0
    try {
        const userId = req.user?.sub;
        const { limit = 100, offset = 0 } = req.query;

        if (!userId) {  // shouldnt happen since protected route 
            return res.status(401).json({ message: "Unauthorized" }).end();
        }

        const [domains, error] = await GetUserDomainsService(userId, Number(limit), Number(offset));
        if (error) {
            logger.warn({ ...LogWarningDefault(req), error }, "Error in GetUserDomainsController: ")
            return res.status(500).json({ message: "Failed to get user domains" }).end();
        }
        return res.status(200).json({ domains }).end();
    } catch (error) {
        next(new Error("Failed to get user domains: ", { cause: error }));
    }
}

