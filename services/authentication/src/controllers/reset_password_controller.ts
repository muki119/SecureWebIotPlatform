import type { Request, Response, NextFunction } from 'express';
import ResetPasswordService from '../services/reset_password';
import { validationResult } from 'express-validator';
import logger from '../config/logger';

export default async function ResetPasswordController(req: Request, res: Response, next: NextFunction) {
    try {
        // takes in the reset password token and new password

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Invalid Credentials" }).end();
        }

        const password = req.body.password;
        const resetToken = req.query.token as string;
        if (!password || !resetToken) {
            return res.status(400).json({ message: "Missing required fields" }).end();
        }
        const result = await ResetPasswordService(resetToken, password);
        if (!result.success) {
            return res.status(400).json({ message: result.message }).end();
        }
        res.status(200).json({ message: result.message }).end();
        logger.info({ userId: result.userId }, `Password reset successful`);
        // should validate the new password 
        // verify that token exists in redis db
        // get the tokens corresponding userid 
        // hash the new password and update the user in the main db

        // delete the token from the redis db to prevent reuse - or mark it as used for the time of its ttl - so if its attempted to be reused - can log from where 
    } catch (err) {
        next(err)
    }
}