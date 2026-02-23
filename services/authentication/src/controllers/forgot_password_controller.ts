import type { Request, Response, NextFunction } from 'express';
import ForgotpasswordService from '../services/forgot_password';
import logger from '../config/logger';
import { validationResult } from 'express-validator';
import { LogWarningDefault } from '../utilities/logging_utilities';

export default async function ForgotPasswordController(req: Request, res: Response, next: NextFunction) {
    try {
        // should validate email
        // should pass to service which will then attempt to see if in db 
        // then should send throug email or something 
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Invalid email" }).end();
        }
        const { email } = req.body;
        if (!email) {
            logger.warn(LogWarningDefault(req), "Forgot password attempt with missing email")
            return res.status(400).json({ message: "Email is required" }).end();
        }
        const result = await ForgotpasswordService(email)
        if (result.message == "Email is required") { // somehow then needs to be flagged and logged - since this is boarderline impossible
            logger.warn(LogWarningDefault(req), "Forgot password attempt with missing email")
        }
        if (result.message == "Email not found") { // this is a common occurrence and not really a warning - but should be logged for metrics and monitoring purposes
            logger.info({ ...LogWarningDefault(req), email }, "Email not found in system")
        }
        logger.info({ email, result }, "Forgot password attempt")
        res.status(200).json({ message: "If the email exists in our system, a reset token will be sent" }).end(); // for security , dosent matter the result
    } catch (err) {
        next(err)
    }
}