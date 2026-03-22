import type { Request, Response, NextFunction } from 'express';
import { LeaveDomainService } from '../../services';

export default async function LeaveDomainController(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.sub;
        const { domainId } = req.params;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" }).end();
        }

        if (!domainId) {
            return res.status(400).json({ message: "Domain ID is required" }).end();
        }

        const [_, error] = await LeaveDomainService(userId, domainId as string);

        if (error) {
            return res.status(400).json({ message: error.message }).end();
        }

        return res.status(200).json({ message: "Left domain successfully" }).end();
    } catch (error) {
        next(new Error("Failed to leave domain", { cause: error }));
    }
}