import { userModel } from "../models/user_model"
import { CreateResetToken } from "../helpers/password_reset_helpers"
import type { Result } from "@services/common/types"

export default async function ForgotpasswordService(email: string): Promise<Result<null>> {
    // typically 
    // create a reset token and email it to user email - get users emailfrom db
    try {
        // find email in db - (should be indexed) - if not found - throw not found error

        // if found get its userid and create a reset token for the userid 
        // email the token to the user 
        if (!email) {
            return [null, new Error("Email is required")] // this should be flagged and logged - since this is boarderline impossible
        }
        const user = await userModel.findByEmail(email)
        if (!user) {
            return [null, new Error("Email not found")] // dont want to give away if the email exists or not for security reasons
        }
        const resetToken = await CreateResetToken(user.id)
        // email the token to the user - to be added - for right now just returns the token (testing)
        return [null, null]

    } catch (error) {
        throw new Error("Error in forgot password service", { cause: error })
    }
}