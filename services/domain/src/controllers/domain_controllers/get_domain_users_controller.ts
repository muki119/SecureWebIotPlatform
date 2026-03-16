import type { Request, Response, NextFunction } from 'express';

export default function GetDomainUsersController(req: Request, res: Response, next: NextFunction) {
    // gets all the users in a domain 
    // will probably involve a join table
    // only basic user info , like their display name i think , no need for email UNLESS MAYBE admin
    // paginated with a limit of 50
    // default offset is 0
}