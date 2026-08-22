import { LogWarningDefault } from "@services/common/utilities";
import type { NextFunction, Request, Response } from "express";
import logger from "../../config/logger";
import { GetUsersProfileService } from "../../services";

/**
 * @description - gets the requester profile
 */
export default async function GetUsersProfileController(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	// to get the requesters profile - not anybody elses
	try {
		const userID = req.user?.sub; // should be set by the auth middleware
		if (!userID) {
			// somehow got past the auth middleware
			logger.warn(
				LogWarningDefault(req),
				"Unauthorized access to GetUsersProfileController - no user ID in request",
			);
			return res.status(401).json({ error: "Unauthorized" }).end();
		}
		const profile = await GetUsersProfileService(userID);
		if (!profile) {
			return res.status(404).json({ error: "Profile not found" }).end();
		}
		return res.status(200).json(profile).end();
	} catch (error) {
		next(new Error("Error getting users profile", { cause: error }));
	}
}
