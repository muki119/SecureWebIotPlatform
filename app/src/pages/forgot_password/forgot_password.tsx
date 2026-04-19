import ForgotPasswordForm from "./forgot_password_form";
import ForgotPasswordConfirmCard from "./forgot_password_confirm_card";
import { useState } from "react";

export default function ForgotPassword() {
	const [email, setEmail] = useState("");
	const [isSubmitted, setIsSubmitted] = useState(false);
	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-4">
			{isSubmitted ? <ForgotPasswordConfirmCard /> : <ForgotPasswordForm />}
		</div>
	);
}
