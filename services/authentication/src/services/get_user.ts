import { userModel, User } from "../models/user_model";


export default async function GetUserService(userId: string): Promise<User | null> {
    try {
        const user = await userModel.findById(userId)
        if (!user) {
            return null
        }
        return user
    } catch (error) {
        throw new Error("Error in get user service", { cause: error })
    }
}