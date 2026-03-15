import { userModel, type IUser } from "../models/user_model";
import { HashPassword } from "../utilities/password_hash";
import type { ModelDTO } from "@services/common/types";
import type { ServiceResult } from "../types/service";
export default async function RegisterService(user: ModelDTO<IUser>): Promise<ServiceResult> {
    try {

        const existingUser = await userModel.existsByEmail(user.email)
        if (existingUser) {
            return { success: false, message: "Email already in use" }
        }

        const passwordHash = await HashPassword(user.password)
        user.password = passwordHash
        const createdUser = await userModel.create(user) // will be used to send to stream for record creation in other services- like the domain service - to be added

        // send id email and full name to stream for record creation in other services- like the domain service 
        return { success: true, }
    } catch (error) {
        throw new Error("Error in register service", { cause: error })
    }
}