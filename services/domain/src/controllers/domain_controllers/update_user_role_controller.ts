import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { UpdateUserRoleService } from "../../services";

export default async function UpdateUserRoleController(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	// owner / admin cannot change their own role
	// only owner can make more admins
	// its a tiered system
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() }).end();
		}
		const userId = req.user?.sub;
		const { domainId, userToUpdate } = req.params;
		const { role } = req.body;
		if (!userId) {
			// shouldnt happen since protected route
			return res.status(401).json({ message: "Unauthorized" }).end();
		}
		if (userId === userToUpdate) {
			return res
				.status(400)
				.json({ message: "Users cannot change their own role" })
				.end();
		}
		const [_, err] = await UpdateUserRoleService(
			userId,
			userToUpdate as string,
			role as string,
			domainId as string,
		);
		if (err) {
			return res.status(400).json({ message: err.message }).end();
		}
		return res
			.status(200)
			.json({ message: "User role updated successfully" })
			.end();
	} catch (error) {
		next(new Error("Failed to update user role", { cause: error }));
	}
}
