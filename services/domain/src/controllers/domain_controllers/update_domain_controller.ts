import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { UpdateDomainService } from "../../services";

export default async function UpdateDomainController(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() }).end();
		}
		const userId = req.user?.sub;
		if (!userId) {
			// shouldnt happen since protected route
			return res.status(401).json({ message: "Unauthorized" }).end();
		}
		const { domainId } = req.params;
		const { changes } = req.body;
		if (!changes || Object.keys(changes).length === 0) {
			return res
				.status(400)
				.json({ message: "No changes provided" })
				.end();
		}
		const [updatedDomain, err] = await UpdateDomainService(
			userId,
			domainId as string,
			changes,
		);
		if (err) {
			return res.status(400).json({ message: err.message }).end();
		}
		return res.status(200).json(updatedDomain).end();
	} catch (error) {
		next(new Error("Failed to update domain", { cause: error }));
	}
}
