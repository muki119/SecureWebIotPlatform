import { GetEnvNumber, GetEnvString } from "@services/common/utilities";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	host: GetEnvString("SMTP_HOST", "localhost"),
	port: GetEnvNumber("SMTP_PORT", 1025),
	auth: {
		user: GetEnvString("SMTP_USER", ""),
		pass: GetEnvString("SMTP_PASS", ""),
	},
});

export default transporter;
