import { userModel } from "../models/user_model"
import { CreateResetToken } from "../helpers/password_reset_helpers"
import { ServiceResult } from "../types/service"

export default async function ForgotpasswordService(email: string): Promise<ServiceResult & { token?: string }> {
    // typically 
    // create a reset token and email it to user email - get users emailfrom db
    try {
        // find email in db - (should be indexed) - if not found - throw not found error

        // if found get its userid and create a reset token for the userid 
        // email the token to the user 
        if (!email) {
            return { success: false, message: "Email is required" }
        }
        const user = await userModel.findByEmail(email)
        if (!user) {
            return { success: false, message: "If the email exists in our system, a reset token will be sent" } // dont want to give away if the email exists or not for security reasons
        }
        const resetToken = await CreateResetToken(user.id)
        // email the token to the user - to be added - for right now just returns the token (testing)
        return { success: true, message: "Successfully created reset token", token: resetToken }

    } catch (error) {
        throw new Error("Error in forgot password service", { cause: error })
    }
}