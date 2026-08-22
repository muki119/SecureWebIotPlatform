import { LogWarningDefault } from "@services/common/utilities";
import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import logger from "../config/logger";
import ForgotpasswordService from "../services/forgot_password";

export default async function ForgotPasswordController(
	req: Request,
	res: Response,
	next: NextFunction,
) {
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
			logger.warn(
				LogWarningDefault(req),
				"Forgot password attempt with missing email",
			);
			return res.status(400).json({ message: "Email is required" }).end();
		}
		const [_, err] = await ForgotpasswordService(email);
		if (err) {
			res.status(400).json({ message: err.message }).end();
			return;
		}
		res.status(200)
			.json({
				message:
					"If the email exists in our system, a reset token will be sent",
			})
			.end(); // for security , dosent matter the result
	} catch (error) {
		next(error);
	}
}
