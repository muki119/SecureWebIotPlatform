import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import RegisterService from "../services/register_service";

export default async function RegisterController(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		// should be validated
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res
				.status(400)
				.json({ message: "Validation errors", errors: errors.array() })
				.end();
		}
		const { email, password, forename, surname } = req.body;
		if (!email || !password || !forename || !surname) {
			return res
				.status(400)
				.json({ message: "Missing required fields" })
				.end();
		}
		const [_, err] = await RegisterService({
			email,
			password,
			forename,
			surname,
		});
		if (err) {
			return res.status(400).json({ message: err.message });
		}
		res.status(201).json({ message: "User registered successfully" }).end();
		return;
	} catch (error) {
		next(error);
	}
}
