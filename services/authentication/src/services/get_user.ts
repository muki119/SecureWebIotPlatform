import { userModel, type User } from "../models/user_model";


export default async function GetUserService(userId: string): Promise<Omit<User, "password"> | null> {
    try {
        const user = await userModel.findByIdWithoutPassword(userId)
        if (!user) {
            return null
        }
        return user
    } catch (error) {
        throw new Error("Error in get user service", { cause: error })
    }
}