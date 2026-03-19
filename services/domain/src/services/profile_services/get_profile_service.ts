import { ProfileModelInstance } from "../../models";

export default async function GetProfileService(userID: string) {
    try {
        if (!userID) {
            throw new Error("User ID is required to get profile");
        }
        const profile = await ProfileModelInstance.findById(userID); // no need to thrwo since not finding a profile is not an exceptional error, just return null
        return profile;
    } catch (error) {
        throw new Error("Error getting profile", { cause: error }); // FOR EXCEPTIONAL ERRORS LIKE A DB ERROR
    }
}