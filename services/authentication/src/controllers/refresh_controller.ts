import type { NextFunction, Request, Response } from "express";
import {
	ClearCookies,
	RefreshTokenCookieOptions,
	tokenNames,
	XsrfTokenCookieOptions,
} from "../config/cookies";
import logger from "../config/logger";
import { ErrBlockedToken } from "../helpers/token_bundle";
import { TokenBundleInstance } from "../helpers/token_helpers";
export default async function RefreshController(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		// get the refresh token from the cookie
		// get the xsrf token from the header and cookie
		// comapre the xsrf tokens
		// verify both xsrf and refreh tokens for validity and expiry
		// if both the xsrf sub and refresh jti are the same then proceed to generate a new pair
		if (!req.cookies) {
			logger.info(
				{ user_agent: req.headers["user-agent"] },
				"Refresh attempt with missing cookies",
			);
			return res.status(401).json({ message: "No cookies found" });
		}
		const { refreshToken, xsrfToken } = req.cookies;

		if (!refreshToken || !xsrfToken) {
			logger.info(
				{
					tokens: {
						refreshToken: { missing: !refreshToken },
						xsrfToken: { missing: !xsrfToken },
					},
					user_agent: req.headers["user-agent"],
				},
				"Refresh attempt with missing refresh token or xsrf token",
			);
			return res.status(401).json({ message: "Missing tokens" });
		}
		const xsrfTokenHeader = req.headers[
			tokenNames.XSRF_HEADER_NAME
		] as string;

		if (xsrfToken !== xsrfTokenHeader) {
			return res.status(401).json({ message: "Invalid XSRF token" });
		}
		const refreshTokenClaims =
			TokenBundleInstance.VerifyRefreshToken(refreshToken);
		if (!refreshTokenClaims) {
			// invalid refresh token - should clear cookie and force logout and login again
			ClearCookies(res);
			res.status(401).json({ message: "Invalid refresh token" });
			res.end();
			return;
		}
		const xsrfTokenPayload = TokenBundleInstance.VerifyXsrfToken(
			xsrfToken,
			refreshTokenClaims.jti,
		);
		if (!xsrfTokenPayload) {
			// if a bad token then its already logged in the verify function itself
			// invalid xsrf token - should clear cookie and force logout and login again
			ClearCookies(res);
			res.status(401).json({ message: "Invalid XSRF token" });
			res.end();
			return;
		}
		const [newTokenBundle, error] =
			await TokenBundleInstance.RefreshTokens(refreshTokenClaims);
		if (error) {
			if (error.message === ErrBlockedToken) {
				res.status(401).json({ message: "Token is Blocked" }).end();
				return;
			}
			return res.status(400).json({ message: error.message });
		}
		res.cookie(
			tokenNames.REFRESH_TOKEN_COOKIE_NAME,
			newTokenBundle.refreshToken,
			RefreshTokenCookieOptions(newTokenBundle.expiry),
		);
		res.cookie(
			tokenNames.XSRF_TOKEN_COOKIE_NAME,
			newTokenBundle.xsrfToken,
			XsrfTokenCookieOptions(newTokenBundle.expiry),
		);
		res.json({ accessToken: newTokenBundle.accessToken });
		res.end();
		return;
	} catch (err) {
		next(err);
	}
}
