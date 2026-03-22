import type { Request, Response, NextFunction } from 'express';
import { DeleteDomainService } from '../../services';

export default async function DeleteDomainController(req: Request, res: Response, next: NextFunction) {
    // multi table opperation
    // must check if user is owner 
    try {
        const userId = req.user?.sub
        const { domainId } = req.params;
        if (!userId) {  // shouldnt happen since protected route 
            return res.status(401).json({ message: "Unauthorized" }).end();
        }
        if (!domainId) {
            return res.status(400).json({ message: "Domain ID is required" }).end();
        }
        const [_, err] = await DeleteDomainService(userId, domainId as string)
        if (err) {
            return res.status(403).json({ message: err.message }).end();
        }
        return res.status(200).json({ message: "Domain deleted successfully" }).end();

    } catch (error) {
        next(new Error("Failed to delete domain", { cause: error }));
    }
}