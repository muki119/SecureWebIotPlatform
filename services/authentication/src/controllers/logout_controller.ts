import type { Request, Response, NextFunction } from 'express';
import { ClearCookies, tokenNames } from '../config/cookies';
import { logger } from "../config/logger"
import { VerifyRefreshToken, BlockToken } from '../helpers/token_helpers';

export default function LogoutController(req: Request, res: Response, next: NextFunction) {
    try {
        // should log that theyve logged out - should potentially log the user id - means that we have to take either access or refresh token if available
        const refreshToken = req.cookies[tokenNames.REFRESH_TOKEN_COOKIE_NAME];
        const refreshTokenClaims = refreshToken ? VerifyRefreshToken(refreshToken) : null;
        if (refreshTokenClaims) {
            BlockToken(refreshTokenClaims.jti, refreshTokenClaims.exp); // block the token until it expires - this is to prevent reuse of the same refresh token after logout
            logger.info({ userId: refreshTokenClaims.sub }, "User has logged out");
        }
        ClearCookies(res)
        res.json({ message: 'Logged out successfully' });
        res.end();
    } catch (err) {
        next(err)
    }
}