import type { Request, Response, NextFunction } from 'express';
import { ROLES } from '@services/common/constants';
import { AddUserService } from '../../services';
import { validationResult } from 'express-validator';

export default async function AddUserController(req: Request, res: Response, next: NextFunction) {
    // adds a user to a domain with a specific role
    // only admin can add users to a domain
    // requires the users email and role
    // default role is member if not specified (somehow)
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() }).end();
        }
        const { domainId } = req.params;
        const { id, role = ROLES.MEMBER } = req.body;
        if (role == ROLES.OWNER) {
            return res.status(400).json({ message: "Cannot assign owner role to another user" }).end();
        }
        const userId = req.user?.sub; // should be set by auth middleware
        if (!userId) {  // shouldnt happen since protected route 
            return res.status(401).json({ message: "Unauthorized" }).end();
        }
        const [_, error] = await AddUserService(userId, id, domainId as string, role)
        if (error) {
            return res.status(400).json({ message: error.message }).end();
        }
        return res.status(200).json({ message: "User successfully added to domain" }).end();
    } catch (error) {
        next(new Error("Failed to add user to domain: ", { cause: error }))
    }



}