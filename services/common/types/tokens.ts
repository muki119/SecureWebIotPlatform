declare global {
    namespace Express {
        interface Request {
            user?: AccessTokenClaims; // the user information from the access token claims - will be used in the controllers to access the users information
        }
    }
}


export interface BaseTokenClaims {
    sub: string; // id
    aud: string; // audience
    iss: string; // issuer
    exp: Seconds; // expiration time in seconds
    iat: number; // issued at time in seconds
}
export interface RefreshTokenClaims extends BaseTokenClaims {
    jti: string; // unique identifier for the token - used for blocklisting
}
export interface AccessTokenClaims extends BaseTokenClaims { }

export interface Tokens {
    accessToken: string;
    refreshToken: string;
    xsrfToken: string;
}

export type Seconds = number; // just easier to understand that the values are in seconds