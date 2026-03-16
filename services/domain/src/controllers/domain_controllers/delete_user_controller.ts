import type { Request, Response, NextFunction } from 'express';

export default function DeleteDomainUserController(req: Request, res: Response, next: NextFunction) {
    // OWNER CANNOT DELETE THEMSELVES
    // multi table opperation
    // set delete to time to now
}