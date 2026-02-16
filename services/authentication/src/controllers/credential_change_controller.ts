import type { Request, Response, NextFunction } from 'express';
import type { UpdatePatch, UpdateSet } from '../types/models';
import { User } from '../models/user_model';
import { validationResult } from 'express-validator';
export default function CredentialChangeController(req: Request, res: Response, next: NextFunction) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Invalid Credentials", errors: errors.array() }).end();
        }
        const { changes }: { changes: UpdatePatch<User> } = req.body;
        if (!changes || Object.keys(changes).length === 0) {
            return res.status(400).json({ message: "No changes provided" }).end();
        }
        const userId = req.user?.sub;
        if (!userId) {  // shouldnt happen since protected route 
            return res.status(401).json({ message: "Unauthorized" }).end();
        }


    } catch (err) {
        next(err)
    }
}