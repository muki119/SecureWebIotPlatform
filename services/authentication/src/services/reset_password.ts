import { VerifyResetToken, InvalidateResetToken } from "../helpers/password_reset_helpers";
import { userModel } from "../models/user_model";
import { HashPassword, VerifyPassword } from "../utilities/password_hash";
import type { Result } from "@services/common/types";


export default async function ResetPasswordService(resetToken: string, newPassword: string): Promise<Result<null>> {
    try {
        const userId = await VerifyResetToken(resetToken)
        if (!userId) {

            return [null, new Error("Invalid or expired reset token")]
        }
        // if the token is valid then we can update the users password 
        const userExists = await userModel.findById(userId)
        if (!userExists) {
            return [null, new Error("User not found")]
        }

        if (await VerifyPassword(newPassword, userExists.password)) {
            return [null, new Error("New password cannot be the same as the old password")]
        }
        const passwordHash = await HashPassword(newPassword)
        await userModel.update(userId, [{ field: "password", value: passwordHash }])
        await InvalidateResetToken(userId) // invalidate the token after successful password reset to prevent reuse
        return [null, null]
    } catch (error) {
        throw new Error("Error in reset password service", { cause: error })
    }
}