import { useContext, useState } from "react";
import { API_ROUTES } from "@/constants/api_routes";
import { AuthContext } from "@/contexts/auth_context";
import ForgotPasswordConfirmCard from "./forgot_password_confirm_card";
import ForgotPasswordForm from "./forgot_password_form";

export default function ForgotPassword() {
	const authContext = useContext(AuthContext);
	if (!authContext) {
		throw new Error("AuthContext is not available");
	}
	const { authClientRequest } = authContext;
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (email: string) => {
		setError(null);
		const [r, err] = await authClientRequest.current.post(
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
