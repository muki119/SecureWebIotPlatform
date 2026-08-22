import { LogWarningDefault } from "@services/common/utilities";
import type { NextFunction, Request, Response } from "express";
import logger from "../../config/logger";
import { SearchUsersService } from "../../services";

export default async function SearchUsersController(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const { email, limit } = req.query as {
			email?: string;
			limit?: string;
		};
		if (!email) {
			return res
				.status(400)
				.json({ error: "Email query parameter is required" })
				.end();
		}

		const [profiles, err] = await SearchUsersService(
			email,
			limit ? parseInt(limit, 10) : 50,
		);
		if (err) {
			logger.error(
				{ ...LogWarningDefault(req), email },
				"Error searching for users",
			);
			return res.status(400).json({ error: err.message }).end();
		}
		return res.status(200).json(profiles).end();
	} catch (error) {
		next(new Error("Error in SearchUsersController", { cause: error }));
	}
}
