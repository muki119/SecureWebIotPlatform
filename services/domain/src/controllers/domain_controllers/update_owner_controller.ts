import type { Request, Response, NextFunction } from 'express';
import { UpdateOwnerService } from '../../services';
import { validationResult } from 'express-validator';

export default async function UpdateOwnerController(req: Request, res: Response, next: NextFunction) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() }).end()
        }
        const userId = req.user?.sub
        const { domainId } = req.params
        const { newOwnerId } = req.body

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" }).end()
        }
        const [_, err] = await UpdateOwnerService(userId, newOwnerId, domainId as string)
        if (err) {
            return res.status(400).json({ message: err.message }).end()
        }
        return res.status(200).json({ message: "Ownership transferred successfully" }).end()
    } catch (error) {
        next(new Error("Failed to transfer ownership", { cause: error }))
    }
}