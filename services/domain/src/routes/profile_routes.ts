import {
    GetUsersProfileController,
    GetProfileController,
    UpdateProfileController
} from "../controllers/profile_controllers"
import { Router } from "express";

const ProfileRouter = Router();
/**
 * Profile
 * - create profile - on Auth.userCreated event
 * - get your profile - GET /me - uses access token to get userId
 * - get profile - GET /profile?userId=string
 * - update profile - PATCH /me- body {field: string, value: string}
 * - delete profile - on Auth.userDeleted event
 */
// the parent route is profile
ProfileRouter.get("/me", GetUsersProfileController);
ProfileRouter.get("/:userId", GetProfileController); // frontend should check if requested profile is their own and if so use the /me route instead 
ProfileRouter.patch("/me", UpdateProfileController); // updates the users profile - only allows updating of display name for now

export default ProfileRouter;