import { Router } from "express";
import {
	GetProfileController,
	GetUsersProfileController,
	SearchUsersController,
	UpdateProfileController,
} from "../controllers/profile_controllers";

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
ProfileRouter.get("/search", SearchUsersController);
ProfileRouter.patch("/me", UpdateProfileController); // updates the users profile - only allows updating of display name for now
ProfileRouter.get("/:userId", GetProfileController); // frontend should check if requested profile is their own and if so use the /me route instead

export default ProfileRouter;
