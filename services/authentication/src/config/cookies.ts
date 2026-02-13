import type { CookieOptions } from "express"


export const tokenNames = {
    XRSFTOKEN_COOKIE_NAME: "xsrfToken",
    XSRF_HEADER_NAME: "x-xsrf-token",
    REFRESH_TOKEN_COOKIE_NAME: "refreshToken"
} as const



export const RefreshTokenCookieOptions = (maxAge: number): CookieOptions => {
    return {
        httpOnly: true,
        secure: false, // only send over https - should be dependent on environment - set to true in production
        sameSite: "lax", // prevent csrf attacks
        maxAge: maxAge // one week in milliseconds
    }
}

export const XsrfTokenCookieOptions = (maxAge: number): CookieOptions => {
    return {
        httpOnly: false, // to be double sent in header and cookie - also used for auto login so when on login page the user gets moved to the dashboard automatically and then the application can do an optimistic call
        secure: false, // only send over https - should be dependent on environment - set to true in production
        sameSite: "lax", // prevent csrf attacks
        maxAge: maxAge // one week in milliseconds
    }
}


export function ClearCookies(res: any) {
    res.clearCookie(tokenNames.REFRESH_TOKEN_COOKIE_NAME)
    res.clearCookie(tokenNames.XRSFTOKEN_COOKIE_NAME)
}