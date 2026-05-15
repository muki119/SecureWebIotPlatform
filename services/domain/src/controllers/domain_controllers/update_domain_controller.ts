import type { Request, Response, NextFunction } from 'express';
import { UpdateDomainService } from '../../services';
export default async function UpdateDomainController(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.sub
        if (!userId) {  // shouldnt happen since protected route
            return res.status(401).json({ message: "Unauthorized" }).end();
        }
        const { domainId } = req.params;
        const { changes } = req.body;
        if (!domainId) {
            return res.status(400).json({ message: "Domain ID is required" }).end();
        }
        if (!changes || Object.keys(changes).length === 0) {
            return res.status(400).json({ message: "No changes provided" }).end();
        }
        const [updatedDomain, err] = await UpdateDomainService(userId, domainId as string, changes);
        if (err) {
            return res.status(400).json({ message: err.message }).end();
        }
        return res.status(200).json(updatedDomain).end();
    } catch (error) {
        next(new Error("Failed to update domain", { cause: error }));
    }
}