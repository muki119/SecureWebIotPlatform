import { GetEnvString } from "@services/common/utilities";
import transporter from "../config/mailer";

export async function SendResetTokenEmail(
	email: string,
	token: string,
): Promise<void> {
	try {
		if (!email) {
			throw new Error("Email is required to send reset token");
		}
		if (!token) {
			throw new Error("Reset token is required to send reset email");
		}
		const from = GetEnvString("SMTP_FROM", "noreply@secureiot.local");
		const resetUrl = `http://localhost/reset-password?token=${token}`;

		await transporter.sendMail({
			from,
			to: email,
			subject: "Reset your password",
			html: `
            <p>You requested a password reset.</p>
            <p><a href="${resetUrl}">Click here to reset your password</a></p>
            <p>This link expires in 5 minutes.</p>
            <p>If you did not request this, ignore this email.</p>
        `,
		});
	} catch (error) {
		throw new Error("Error sending reset token email", { cause: error });
	}
}
