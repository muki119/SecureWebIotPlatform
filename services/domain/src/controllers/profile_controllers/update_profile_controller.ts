import { LogWarningDefault } from "@services/common/utilities";
import type { NextFunction, Request, Response } from "express";
import logger from "../../config/logger";
import { UpdateProfileService } from "../../services";

export default async function UpdateProfileController(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const userID = req.user?.sub; // should be set by the auth middleware
		if (!userID) {
			// somehow got past the auth middleware
			logger.warn(
				LogWarningDefault(req),
				"Unauthorized access to UpdateProfileController - no user ID in request",
			);
			return res.status(401).json({ error: "Unauthorized" }).end();
		}
		const { changes } = req.body;
		const [updatedProfile, err] = await UpdateProfileService(
			changes,
			userID,
		);

		if (err) {
			logger.error(
				LogWarningDefault(req),
				`Error updating profile for user ${userID}: ${err.message}`,
			);
			return res.status(400).json({ error: err.message });
		}
		res.status(200).json(updatedProfile).end();
	} catch (error) {
		next(error);
	}
}
