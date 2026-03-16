import type { Request, Response, NextFunction } from 'express';

export default function GetUserDomainsController(req: Request, res: Response, next: NextFunction) {
    // gets all the users domains
    // paginated with a limit of 50
    // join table opperations to get domainsid, and name - further details will be requested on click
    // default offset is 0

}