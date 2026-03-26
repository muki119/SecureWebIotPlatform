import type { Request, Response, NextFunction } from 'express';
import { GetProfileService } from '../../services';



/**
 * @description - gets a users profile - for when a user wants to see another users profile
 */
export default async function GetProfileController(req: Request, res: Response, next: NextFunction) {
    // for single lookup of a profile - when a user want to see anothers
    try {
        const { userId } = req.params;
        console.log(userId)
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        const profile = await GetProfileService(userId as string);
        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }
        return res.status(200).json(profile);
    } catch (error) {
        next(new Error("Error getting profile", { cause: error }));
    }
}