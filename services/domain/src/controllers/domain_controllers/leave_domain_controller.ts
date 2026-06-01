import type { Request, Response, NextFunction } from 'express';
import { LeaveDomainService } from '../../services';
import { validationResult } from 'express-validator';

export default async function LeaveDomainController(req: Request, res: Response, next: NextFunction) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() }).end();
        }
        const userId = req.user?.sub;
        const { domainId } = req.params;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" }).end();
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