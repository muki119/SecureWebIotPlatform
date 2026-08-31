import { useContext, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { API_ROUTES } from "@/constants/api_routes";
import { AuthContext } from "@/contexts/auth_context";
import ResetForm from "./reset_form";
import SuccessfulResetCard from "./successful_reset_card";

export default function ResetPassword() {
	const authContext = useContext(AuthContext);
	if (!authContext) {
		throw new Error("AuthContext is not available");
	}
	const { authClientRequest } = authContext;
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
		const [r, err] = await authClientRequest.current.post(
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
