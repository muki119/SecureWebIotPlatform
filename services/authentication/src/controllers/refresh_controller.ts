import type { Request, Response, NextFunction } from 'express';
import { VerifyRefreshToken, VerifyXsrfToken, TokenBundle } from '../helpers/token_helpers';
import { tokenNames, RefreshTokenCookieOptions, XsrfTokenCookieOptions, ClearCookies } from '../config/cookies';
import logger from '../config/logger';
export default async function RefreshController(req: Request, res: Response, next: NextFunction) {
    try {
        // get the refresh token from the cookie
        // get the xsrf token from the header and cookie 
        // comapre the xsrf tokens 
        // verify both xsrf and refreh tokens for validity and expiry
        // if both the xsrf sub and refresh jti are the same then proceed to generate a new pair 
        if (!req.cookies) {
            logger.warn({ req }, "Refresh attempt with missing cookies")
            return res.status(401).json({ message: 'No cookies found' });
        }
        const { refreshToken, xsrfToken } = req.cookies;
        const xsrfTokenHeader = req.headers[tokenNames.XSRF_HEADER_NAME] as string;

        if (xsrfToken !== xsrfTokenHeader) {
            return res.status(401).json({ message: 'Invalid XSRF token' });
        }
        const refreshTokenClaims = VerifyRefreshToken(refreshToken);
        if (!refreshTokenClaims) {
            // invalid refresh token - should clear cookie and force logout and login again
            ClearCookies(res)
            res.sendStatus(401).json({ message: 'Invalid refresh token' });
            res.end();
            return
        }
        const xsrfTokenPayload = VerifyXsrfToken(xsrfToken, refreshTokenClaims.jti);
        if (!xsrfTokenPayload) {
            // if a bad token then its already logged in the verify function itself
            // invalid xsrf token - should clear cookie and force logout and login again
            ClearCookies(res)
            res.sendStatus(401).json({ message: 'Invalid XSRF token' });
            res.end();
            return
        }
        const newTokenBundle = await TokenBundle.RefreshTokens(refreshTokenClaims)
        res.cookie(tokenNames.REFRESH_TOKEN_COOKIE_NAME, newTokenBundle.refreshToken, RefreshTokenCookieOptions(newTokenBundle.expiry));
        res.cookie(tokenNames.XRSFTOKEN_COOKIE_NAME, newTokenBundle.xsrfToken, XsrfTokenCookieOptions(newTokenBundle.expiry));
        res.json({ accessToken: newTokenBundle.accessToken });
        res.end();
        return;


    } catch (err) {
        next(err)
    }
}


