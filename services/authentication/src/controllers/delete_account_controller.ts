import type { Request, Response, NextFunction } from "express";
import DeleteUserService from "../services/delete_user";
import { tokenNames } from "../config/cookies";
import { TokenBundleInstance } from "../helpers/token_helpers";
export default async function DeleteUserController(req: Request, res: Response, next: NextFunction) {
    try {

        // id should come from the access token - from the middleware
        const userid = req.user?.sub;
        if (!userid) {
            return res.status(401).json({ message: "Unauthorized" }).end();
        }
        const { password } = req.body; // this is to confirm deletion

        const [result, error] = await DeleteUserService(userid, password);
        if (error) {
            return res.status(400).json({ message: error.message }).end();
        }
        // should blocklist the refresh also
        const refreshToken = req.cookies[tokenNames.REFRESH_TOKEN_COOKIE_NAME];
        if (refreshToken) { // if theres a refresh token - blocklist it , otherwise it dosent matter since the user is deleted and all systems will catch up to that
            const claims = TokenBundleInstance.VerifyRefreshToken(refreshToken);
            if (claims) {
                await TokenBundleInstance.BlockToken(claims.jti, claims.exp)
            }
        }
        res.status(200).clearCookie(tokenNames.REFRESH_TOKEN_COOKIE_NAME).end();
    } catch (err) {
        next(err)
    }
}