import type { Request, Response, NextFunction } from 'express';
import { GetDomainUsersService } from '../../services';
import { validationResult } from 'express-validator';

export default async function GetDomainUsersController(req: Request, res: Response, next: NextFunction) {
    // gets all the users in a domain
    // will probably involve a join table
    // only basic user info , like their display name i think , no need for email UNLESS MAYBE admin
    // paginated with a limit of 50
    // default offset is 0
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() }).end();
        }
        const userId = req.user?.sub
        const { domainId } = req.params;
        const { limit = 100, offset = 0 } = req.query;

        if (!userId) {  // shouldnt happen since protected route
            return res.status(401).json({ message: "Unauthorized" }).end();
        }
        const [members, err] = await GetDomainUsersService(userId, domainId as string, Number(limit), Number(offset))
        if (err) {
            return res.status(400).json({ message: err.message }).end();
        }
        return res.status(200).json(members).end();
    } catch (error) {
        next(new Error("Failed to get domain users", { cause: error }));
    }

}