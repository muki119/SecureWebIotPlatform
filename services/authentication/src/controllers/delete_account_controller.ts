import type { NextFunction, Request, Response } from "express";
import { ClearCookies, tokenNames } from "../config/cookies";
import { TokenBundleInstance } from "../helpers/token_helpers";
import DeleteUserService from "../services/delete_user";
export default async function DeleteUserController(
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
		const { password } = req.body; // this is to confirm deletion

		const [_, error] = await DeleteUserService(userid, password);
		if (error) {
			return res.status(400).json({ message: error.message }).end();
		}
		// should blocklist the refresh also
		const refreshToken = req.cookies[tokenNames.REFRESH_TOKEN_COOKIE_NAME];
		if (refreshToken) {
			// if theres a refresh token - blocklist it , otherwise it dosent matter since the user is deleted and all systems will catch up to that
			const claims = TokenBundleInstance.VerifyRefreshToken(refreshToken);
			if (claims) {
				await TokenBundleInstance.BlockToken(claims.jti, claims.exp);
			}
		}
		ClearCookies(res);
		res.status(200).end();
		return;
	} catch (err) {
		next(err);
	}
}
