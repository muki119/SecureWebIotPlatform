import type { Request, Response, NextFunction } from 'express';
import { DeleteUserService } from '../../services';
export default async function DeleteDomainUserController(req: Request, res: Response, next: NextFunction) {
    // OWNER CANNOT DELETE THEMSELVES
    // multi table opperation
    // set delete to time to now
    try {
        const userId = req.user?.sub
        const { domainId, userId: userToDelete } = req.params;
        if (!userId) {  // shouldnt happen since protected route
            return res.status(401).json({ message: "Unauthorized" }).end();
        }
        if (!domainId || !userToDelete) {
            return res.status(400).json({ message: "Domain ID and User ID to remove are required" }).end();
        }
        if (userId === userToDelete) {
            return res.status(400).json({ message: "Users cannot remove themselves from the domain this way" }).end();
        }
        const [_, err] = await DeleteUserService(userId, domainId as string, userToDelete as string);
        if (err) {
            return res.status(400).json({ message: err.message }).end();
        }
        return res.status(200).json({ message: "User removed from domain successfully" }).end();

    } catch (error) {
        next(new Error("Error deleting user from domain", { cause: error }));
    }
}