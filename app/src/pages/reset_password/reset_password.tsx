import ResetForm from "./reset_form";
import SuccessfulResetCard from "./successful_reset_card";
import { useSearchParams, useNavigate } from "react-router";
import { useState, useContext } from "react";
import { API_ROUTES } from "@/constants/api_routes";
import { AuthContext } from "@/contexts/auth_context";

export default function ResetPassword() {
	const { authClientRequest } = useContext(AuthContext)!;
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const resetToken = searchParams.get("token");
	const [isResetSuccessful, setIsResetSuccessful] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (!resetToken) {
		navigate("/forgot-password");
		return null;
	}

	const handleReset = async (password: string) => {
		setError(null);
		const [r, err] = await authClientRequest.post(
			API_ROUTES.AUTH.RESET_PASSWORD.path,
			{ password },
			{
				params: { token: resetToken },
			},
		);
		if (err !== null) {
			setError("Something went wrong. Please try again.");
			return;
		}
		if (r?.status === 200) {
			setIsResetSuccessful(true);
			return;
		}
		if (r?.status === 400) {
			setError(r.data?.message ?? "Invalid or expired reset link.");
			return;
		}
		setError("Something went wrong. Please try again.");
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-muted">
			{isResetSuccessful ? (
				<SuccessfulResetCard />
			) : (
				<ResetForm onReset={handleReset} error={error} />
			)}
		</div>
	);
}
