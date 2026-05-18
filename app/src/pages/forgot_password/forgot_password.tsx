import ForgotPasswordForm from "./forgot_password_form";
import ForgotPasswordConfirmCard from "./forgot_password_confirm_card";
import { useState, useContext } from "react";
import { API_ROUTES } from "@/constants/api_routes";
import { AuthContext } from "@/contexts/auth_context";

export default function ForgotPassword() {
	const { authClientRequest } = useContext(AuthContext)!;
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (email: string) => {
		setError(null);
		const [r, err] = await authClientRequest.post(
			API_ROUTES.AUTH.FORGOT_PASSWORD.path,
			{ email },
		);
		if (err !== null) {
			setError("Something went wrong. Please try again.");
			return;
		}
		// Always show the confirm card regardless of whether email exists (security)
		if (r?.status === 200 || r?.status === 404) {
			setIsSubmitted(true);
			return;
		}
		setError("Something went wrong. Please try again.");
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted">
			{isSubmitted ? (
				<ForgotPasswordConfirmCard />
			) : (
				<ForgotPasswordForm onSubmit={handleSubmit} error={error} />
			)}
		</div>
	);
}
