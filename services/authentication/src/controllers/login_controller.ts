import type { Request, Response, NextFunction } from 'express';
import { RefreshTokenCookieOptions, XsrfTokenCookieOptions, tokenNames } from "../config/cookies"
import LoginService from '../services/login_service';
import { TokenBundle } from "../helpers/token_helpers"
import { validationResult } from 'express-validator';
import logger from '../config/logger';

export default async function LoginController(req: Request, res: Response, next: NextFunction) {
    try {
        // should go through validator first
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({ message: 'Invalid email or password' }); // only ammount of info that should be given is that the inputs are invalid
        }
        const { email, password } = req.body;
        const userId = await LoginService(email, password); // returns a token if the successful login - otherwise null - does throw error if something goes wrong
        if (!userId) { // if no token then the email or password is wrong
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const { accessToken, refreshToken, xsrfToken, expiry } = TokenBundle.CreateBundle(userId); // should never throw an error - if it does then something is very wrong and we want to know about it

        // accees is passed in the body
        // refresh and xsrf are passed in http only cookies
        res.cookie(tokenNames.REFRESH_TOKEN_COOKIE_NAME, refreshToken, RefreshTokenCookieOptions(expiry));
        res.cookie(tokenNames.XRSFTOKEN_COOKIE_NAME, xsrfToken, XsrfTokenCookieOptions(expiry));
        res.json({ accessToken });
        res.end();
        logger.info({ userId }, "User has logged in");
        return;
    } catch (err) {
        next(err)
    }
}