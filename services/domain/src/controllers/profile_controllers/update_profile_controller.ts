import type { Request, Response, NextFunction } from 'express';
import UpdateProfileService from '../../services/profile_services/update_profile_service';
import logger from '../../config/logger';

export default async function UpdateProfileController(req: Request, res: Response, next: NextFunction) {
    try {
        const userID = req.user?.sub; // should be set by the auth middleware
        if (!userID) { // somehow got past the auth middleware
            logger.warn("Unauthorized access to UpdateProfileController - no user ID in request");
            return res.status(401).json({ error: "Unauthorized" }).end();
        }
        const changes = req.body;
        const [updatedProfile, error] = await UpdateProfileService(changes, userID);

        if (error) {
            logger.error(`Error updating profile for user ${userID}: ${error.message}`);
            return res.status(400).json({ error: error.message });
        }
        res.status(200).json(updatedProfile).end();
    } catch (error) {
        next(error);
    }
}