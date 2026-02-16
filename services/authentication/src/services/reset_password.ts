import { VerifyResetToken } from "../helpers/password_reset_helpers";
import { userModel } from "../models/user_model";
import { HashPassword } from "../utilities/password_hash";
import { ServiceResult } from "../types/service";

export default async function ResetPasswordService(resetToken: string, newPassword: string): Promise<ServiceResult> {
    try {
        const userId = await VerifyResetToken(resetToken)
        if (!userId) {
            return { success: false, message: "Invalid or expired reset token" }
        }
        // if the token is valid then we can update the users password 
        const userExists = await userModel.existsById(userId)
        if (!userExists) {
            return { success: false, message: "User not found" }
        }
        const passwordHash = await HashPassword(newPassword)
        await userModel.update(userId, [{ field: "password", value: passwordHash }])
        return { success: true, message: "Password reset successfully" }
    } catch (error) {
        throw new Error("Error in reset password service", { cause: error })
    }
}