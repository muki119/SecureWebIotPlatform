import type { Request, Response, NextFunction } from 'express';
import { ROLES } from '../../models';
import { AddUserService } from '../../services';
export default async function AddUserController(req: Request, res: Response, next: NextFunction) {
    // adds a user to a domain with a specific role
    // only admin can add users to a domain
    // requires the users email and role
    // default role is member if not specified (somehow)
    try {
        const { domainId } = req.params;
        const { id, role = ROLES.MEMBER } = req.body; // id of the user to be added  - the id will come from a search by email using the auth service - or maybe adding emails to the profile model and adding a search by email
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
        return res.status(200).json({ message: "User added to domain successfully" }).end();
    } catch (error) {
        next(new Error("Failed to add user to domain: ", { cause: error }))
    }



}