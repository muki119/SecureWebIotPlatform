import type { Request, Response, NextFunction } from 'express';
import { UpdateOwnerService } from '../../services';

export default async function UpdateOwnerController(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.sub
        const { domainId } = req.params
        const { userId: newOwnerId } = req.body

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" }).end()
        }
        if (!domainId || !newOwnerId) {
            return res.status(400).json({ message: "Domain ID and new owner ID are required" }).end()
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