import type { NextFunction, Request, Response } from "express";
import GetUserService from "../services/get_user";
export default async function GetUserController(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		// id should come from the access token - from the middleware
		const userid = req.user?.sub;
		if (!userid) {
			return res.status(401).json({ message: "Unauthorized" }).end();
		}
		const user = await GetUserService(userid); // in this route - it dosent make a whole lot of sense that it returns null , might mean that it got deleted and the cookie is still there or something but yh
		if (!user) {
			return res.status(404).json({ message: "User not found" }).end();
		}
		res.status(200).json(user).end();
	} catch (err) {
		next(err);
	}
}
