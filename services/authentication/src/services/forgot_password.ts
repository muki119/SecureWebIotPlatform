import { STREAMS } from "@services/common/config";
import type { Result } from "@services/common/types";
import { GetEnvString } from "@services/common/utilities";
import eventSender from "../config/event_sender";
import {
	CreateResetToken,
	RESET_TOKEN_TTL_MS,
} from "../helpers/password_reset_helpers";
import { userModel } from "../models/user_model";
export default async function ForgotpasswordService(
	email: string,
): Promise<Result<null>> {
	// typically
	// create a reset token and email it to user email - get users emailfrom db
	try {
		// find email in db - (should be indexed) - if not found - throw not found error

		// if found get its userid and create a reset token for the userid
		// email the token to the user
		if (!email) {
			return [null, new Error("Email is required")]; // this should be flagged and logged - since this is boarderline impossible
		}
		const user = await userModel.findByEmail(email);
		if (!user) {
			return [null, null]; // dont want to give away if the email exists or not for security reasons
		}
		const resetToken = await CreateResetToken(user.id);
		const resetUrl = `${GetEnvString("FRONTEND_URL", "http://localhost")}/reset-password?token=${resetToken}`;
		const expiresInMinutes = String(RESET_TOKEN_TTL_MS / 60_000);

		await eventSender.send(STREAMS.AUTH_SERVICE.PASSWORD_RESET_REQUESTED, {
			email: user.email,
			resetUrl,
			expiresInMinutes,
			timestamp: new Date().toISOString(),
		});

		// the mailer service picks this event up and sends the reset email
		return [null, null];
	} catch (error) {
		throw new Error("Error in forgot password service", { cause: error });
	}
}
