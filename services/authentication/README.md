# Authentication Service

[![Run Codebase Tests](https://github.com/muki119/SecureWebIotPlatform/actions/workflows/run_tests.yml/badge.svg)](https://github.com/muki119/SecureWebIotPlatform/actions/workflows/run_tests.yml)

The Authentication Service is responsible for managing user authentication and account management within the platform.

## Abilities

- User Registration

- User Login

- User Logout

- Password Reset

- Account Deletion

## API Endpoints

- POST `/auth/register` - Register a new user account

- POST `/auth/login` - Authenticate a user and return a JWT token triplet (access, refresh and xsrf)

- GET `/auth/refresh` - Refresh the access token using the refresh token and XSRF token

- POST `/auth/logout` - Invalidate the user's refresh token

- POST `/auth/forgot-password` - Initiate a password reset process for a user account

- POST `/auth/reset-password` - Reset a user's password using a password reset token

- PATCH `/auth/credential-change` - Update the authenticated user's credentials

- GET `/auth/me` - Get the authenticated user's information

- POST `/auth/me/delete` - Delete the authenticated user's account (To be added)

**For more details on the api endpoints, please look at the api documentaion in the docs folder.**

## JWT Tokens

This service issues JWT tokens as a form of stateless sessions for authenticated users.
The tokens are as follows:

- Access token

    A short-lived token (default 15 minutes) that is used to authenticate API requests as well as pass user information to the services. This token is given through the body of the response when a user logs in or refreshes their session.

    The token is passed in the `Authorisation` header of API requests in the format `Bearer <token>`.

    If the token is asymmetrically signed, the public key is shared with other services so they can verify the token and extract the user information from it.

- Refresh token

    A longer-lived token (default 7 days) that is used to refresh the access token when it expires. This token's TTL is fixed to a certain point in time and not rolling like the access token. This means that even if the user is active and refreshing their session, they will still need to re-authenticate after the refresh token expires.

    The token is also blcklisted when the access token is refreshed, or the user logs out.

    When the access token is refreshed, a new refresh token is also issued, and the old one is invalidated. This means that a refresh token can only be used once to refresh the access token.

    The token is passed as an HTTP-only cookie in the response when a user logs in or refreshes their session. The cookie is automatically sent with API requests to the same domain.

    Unlike the access token, the refresh token is symmetrically signed and can only be verified by the Authentication service. It is of no use to other services since its only purpose is to get a new access token from the Authentication service.

- XSRF token

    A random token that is used to protect against cross-site request forgery attacks.

    Though the access token and refresh token mechanisms act as a protection against XSRF attacks for most API routes, the refresh token endpoint is still vulnerable since it relies on cookies for authentication. Therefore, the XSRF token is used as an additional layer of protection for the refresh token endpoint.

    The token is passed as a non-HTTP-only cookie in the response to a user login or refresh.
    However, when refreshing the tokens, it is double-submitted in the `X-XSRF-TOKEN` header of the request and the cookie as well. The server then compares the value in the header with the value in the cookie to make sure that they match before issuing new tokens.

## Event Bus

The Authentication Service has no Streams to listen to, since it mainly acts as the source of truth for user accounts. However, it does emit the following events to the event bus:

- `AUTH_SERVICE.USER_CREATED` - When a user is created by the Authentication service

- `AUTH_SERVICE.USER_DELETED` - When a user is deleted by the Authentication service

- `AUTH_SERVICE.USER_UPDATED` - When a user's information is updated by the Authentication service

## Pre-requisites

- PostgreSQL database server

- A redis server

- A Loki instance (optional, for logging)

- Prometheus and Grafana (optional, for monitoring)

## Additional Documentation

Please refer to additional documentation such as the .env.example for available configuration options.
