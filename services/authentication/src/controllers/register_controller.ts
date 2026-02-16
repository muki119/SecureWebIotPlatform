import type { Request, Response, NextFunction } from 'express';
import RegisterService from '../services/register_service';
import { validationResult } from 'express-validator';

export default async function RegisterController(req: Request, res: Response, next: NextFunction) {
    try {
        // should be validated
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation errors", errors: errors.array() }).end();
        }
        const { email, password, forename, surname } = req.body;
        if (!email || !password || !forename || !surname) {
            return res.status(400).json({ message: "Missing required fields" }).end();
        }
        const result = await RegisterService({ email, password, forename, surname });
        if (!result.success) {
            return res.status(400).json({ message: result.message });
        }
        res.json({ message: result.message }).end();
        return;
    } catch (err) {
        next(err)
    }
}