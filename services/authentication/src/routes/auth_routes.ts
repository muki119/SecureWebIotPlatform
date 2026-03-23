import { Router } from "express";
import {
    LoginController,
    LogoutController,
    RefreshController,
    RegisterController,
    ForgotPasswordController,
    ResetPasswordController,
    CredentialChangeController,
    GetUserController,
    MetricsController
} from "../controllers";
import { SessionMiddleware } from "@services/common/middleware"
import logger from "../config/logger";
import { LoginValidator, RegisterValidator, ForgotPasswordValidator, ResetPasswordValidator } from "../validators/user"

export const authRoutes = Router();
const validSessionMiddleware = new SessionMiddleware(logger).middleware // only allow valid sessions to access these routes, also attaches the user information to the request object from the access token claims so that it can be used in the controllers


authRoutes.post("/login", LoginValidator, LoginController);
authRoutes.delete("/logout", LogoutController);
authRoutes.get("/refresh", RefreshController);
authRoutes.post("/register", RegisterValidator, RegisterController);
authRoutes.post("/forgot-password", ForgotPasswordValidator, ForgotPasswordController); // creates a id in redis attached to the account and sends an email with the id as a query parameter to the reset password page, when the user clicks on the link in the email it will take them to the reset password page where they can enter their new password and the id will be used to verify that the request is valid and then the password will be updated in the database and the id will be deleted from redis
authRoutes.post("/reset-password", ResetPasswordValidator, ResetPasswordController); // only needs password and the id in the redis as a query parameter, the id will be used to verify that the request is valid and then the password will be updated in the database and the id will be deleted from redis
authRoutes.patch("/credential-change", validSessionMiddleware, CredentialChangeController); // should be dynamic based on what credential is being changed, for example if email is being changed then we need to send a verification email to the new email address and if password is being changed then we need to send a verification email to the old email address
authRoutes.get("/me", validSessionMiddleware, GetUserController)
authRoutes.get("/metrics", MetricsController)
// login - returns access token, refresh token, xsrf token in cookie and header
// logout - no need for xsrf token, just need to clear the cookie
// token refresh - access token, refresh token , needs a xsrf token in header and cookie  - will only be accesed when access token is expired and frontend will automatically call this
//register - no need for xsrf
// forgot password - no need for xsrf token, just need email and password, returns access token, refresh token, xsrf token in cookie and header
// reset password - sent through email , no token needed
// credential change - takes access token and xsrf token in header and cookie
// 