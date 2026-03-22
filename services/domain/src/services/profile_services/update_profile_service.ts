import type { UpdatePatch, ServiceResult } from "@services/common/types"
import { type IProfile, ProfileModelInstance } from "../../models"

export default async function UpdateProfileService(changes: UpdatePatch<IProfile>, userID: string): Promise<ServiceResult<IProfile>> {
    try {
        if (!userID) {
            throw new Error("User ID is required to update profile");
        }
        if (Object.keys(changes).length === 0) {
            throw new Error("No changes provided for profile update");
        }
        const [updatedItem, error] = await ProfileModelInstance.update(userID, changes);
        if (error) {
            return [null, error];
        }
        if (!updatedItem) {
            throw new Error("Profile update succeeded but no updated item returned"); // shouldnt ever happen
        }
        return [updatedItem, null];
    } catch (error) {
        throw new Error("Error updating profile", { cause: error });
    }
}