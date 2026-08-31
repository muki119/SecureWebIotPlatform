import { useContext, useState } from "react";
import { API_ROUTES } from "@/constants/api_routes";
import { AuthContext } from "@/contexts/auth_context";
import RegisterForm from "./register_form";
import SuccessCard from "./success_card";

export default function Register() {
	const authContext = useContext(AuthContext);
	if (!authContext) {
		throw new Error("AuthContext is not available");
	}
	const { authClientRequest } = authContext;
	const [isRegistered, setIsRegistered] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleRegister = async (
		forename: string,
		surname: string,
		email: string,
		password: string,
	) => {
		setError(null);
		setLoading(true);
		const [r, err] = await authClientRequest.current.post(
			API_ROUTES.AUTH.REGISTER.path,
			{
				forename,
				surname,
				email,
				password,
			},
		);
		setLoading(false);
		if (err !== null) {
			setError("Something went wrong. Please try again.");
			return;
		}
		if (r?.status === 201) {
			setIsRegistered(true);
			return;
		}
		if (r?.status === 400) {
			setError("An account with this email already exists.");
			return;
		}
		setError(r?.data?.message ?? "Registration failed. Please try again.");
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-muted">
			{isRegistered ? (
				<SuccessCard />
			) : (
				<RegisterForm
					onRegister={handleRegister}
					error={error}
					loading={loading}
				/>
			)}
		</div>
	);
}
