import { type ServiceResult } from "@services/common/types";
import { ProfileModelInstance, type IProfile } from "../../models";

export default async function SearchUsersService(email: string, limit?: number): Promise<ServiceResult<IProfile[]>> {
    try {
        if (!email) {
            return [null, new Error("Email is required to search for users")]
        }
        if (email.length < 3) {
            return [null, new Error("Email must be at least 3 characters long to perform a search")]
        }
        const profiles = await ProfileModelInstance.findByEmail(email, limit)
        return [profiles, null]
    } catch (error) {
        throw new Error("Error searching for users", { cause: error })
    }
}