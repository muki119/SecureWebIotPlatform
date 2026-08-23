import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { DeleteUserService } from "../../services";

export default async function DeleteDomainUserController(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	// OWNER CANNOT DELETE THEMSELVES
	// multi table opperation
	// set delete to time to now
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() }).end();
		}
		const userId = req.user?.sub;
		const { domainId, userToDelete } = req.params;
		if (!userId) {
			// shouldnt happen since protected route
			return res.status(401).json({ message: "Unauthorized" }).end();
		}
		if (userId === userToDelete) {
			return res
				.status(400)
				.json({
					message:
						"Users cannot remove themselves from the domain this way",
				})
				.end();
		}
		const [_, err] = await DeleteUserService(
			userId,
			domainId as string,
			userToDelete as string,
		);
		if (err) {
			return res.status(400).json({ message: err.message }).end();
		}
		return res
			.status(200)
			.json({ message: "User successfully removed from domain" })
			.end();
	} catch (error) {
		next(new Error("Error deleting user from domain", { cause: error }));
	}
}
