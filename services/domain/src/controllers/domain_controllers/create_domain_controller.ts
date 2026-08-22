import { LogWarningDefault } from "@services/common/utilities";
import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import logger from "../../config/logger";
import { CreateDomainService } from "../../services";

export default async function CreateDomainController(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() }).end();
		}
		// the domain model will create a new domain , join table entry and user role entry
		const { name } = req.body;
		const userID = req.user?.sub; // should be set by the auth middleware
		if (!userID) {
			// somehow got past the auth middleware
			logger.warn(
				LogWarningDefault(req),
				"Unauthorized access to CreateDomainController - no user ID in request",
			);
			return res.status(401).json({ error: "Unauthorized" }).end();
		}
		const [result, error] = await CreateDomainService(name, userID);
		if (error) {
			logger.warn(
				{ ...LogWarningDefault(req), error },
				"Error in CreateDomainController: ",
			);
			return res.status(400).json({ error }).end();
		}
		return res.status(201).json(result).end();
	} catch (error) {
		next(new Error("Failed to create domain", { cause: error }));
	}
}
