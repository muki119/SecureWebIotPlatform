import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { DeleteDomainService } from "../../services";

export default async function DeleteDomainController(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	// multi table opperation
	// must check if user is owner
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() }).end();
		}
		const userId = req.user?.sub;
		const { domainId } = req.params;
		if (!userId) {
			// shouldnt happen since protected route
			return res.status(401).json({ message: "Unauthorized" }).end();
		}
		const [_, err] = await DeleteDomainService(userId, domainId as string);
		if (err) {
			return res.status(400).json({ message: err.message }).end();
		}
		return res
			.status(200)
			.json({ message: "Domain deleted successfully" })
			.end();
	} catch (error) {
		next(new Error("Failed to delete domain", { cause: error }));
	}
}
