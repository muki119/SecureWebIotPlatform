import type { Request, Response, NextFunction } from 'express';

export default function AddUserController(req: Request, res: Response, next: NextFunction) {
    // adds a user to a domain with a specific role
    // only admin can add users to a domain
    // requires the users email and role
    // default role is member if not specified (somehow)
}