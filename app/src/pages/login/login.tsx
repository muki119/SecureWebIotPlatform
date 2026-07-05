import { useState, useContext, useEffect } from "react";
import LoginForm from "./login_form";
import { API_ROUTES } from "@/constants/api_routes";
import { CheckXSRFToken } from "@/utilities/check_xsrf";
import { AuthContext } from "@/contexts/auth_context";
import { useNavigate } from "react-router";
export default function Login() {
	// should do a faithful redirect if theres an xsrf token in the cookies or the user is already logged in

	const isAuthenticated = CheckXSRFToken();
	const navigate = useNavigate();
	const { dispatch, authClientRequest } = useContext(AuthContext)!;
	const [userCredentials, setUserCredentials] = useState({
		email: "",
		password: "",
	});
	const [loginError, setLoginError] = useState<string | null>(null);

	const handleLogin = async (e) => {
		e.preventDefault();
		const [r, err] = await authClientRequest.current.login(
			API_ROUTES.AUTH.LOGIN.path,
			{
				...userCredentials,
			},
		);
		if (err !== null) {
			setLoginError("Invalid email or password");
			return;
		}
		if (r.status === 200) {
			dispatch({ type: "LOGIN", payload: r.data });
			navigate("/dashboard");
		}

		if (r.status === 401) {
			setLoginError("Invalid email or password");
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setUserCredentials((prev) => ({
			...prev,
			[name]: value,
		}));
	};
	useEffect(() => {
		if (isAuthenticated) {
			navigate("/dashboard");
		}
	}, [isAuthenticated, navigate]);
	return (
		<div className="min-h-screen flex items-center justify-center bg-muted">
			<LoginForm
				userCredentials={userCredentials}
				handleInputChange={handleInputChange}
				handleLogin={handleLogin}
				loginError={loginError}
			/>
		</div>
	);
}
