import type { Request, Response, NextFunction } from 'express';
import { ClearCookies, tokenNames } from '../config/cookies';
import logger from "../config/logger"
import { TokenBundleInstance } from '../helpers/token_helpers';

export default async function LogoutController(req: Request, res: Response, next: NextFunction) {
    try {
        // should log that theyve logged out - should potentially log the user id - means that we have to take either access or refresh token if available
        const refreshToken = req.cookies[tokenNames.REFRESH_TOKEN_COOKIE_NAME];
        const refreshTokenClaims = refreshToken ? TokenBundleInstance.VerifyRefreshToken(refreshToken) : null; // thing is if its null then its already invald to the system 
        if (refreshTokenClaims) {
            const [_, blockError] = await TokenBundleInstance.BlockToken(refreshTokenClaims.jti, refreshTokenClaims.exp); // block the token until it expires - this is to prevent reuse of the same refresh token after logout
            // lowkey dosent matter because the errors that are returned here are - already blocked or expired , playing perfectly into the flow

            logger.info({ userId: refreshTokenClaims.sub }, "User has logged out");
        }
        ClearCookies(res)
        res.json({ message: 'Logged out successfully' });
        res.end();
        return;
    } catch (err) {
        next(err)
    }
}