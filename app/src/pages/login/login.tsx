import { useState, useContext } from "react";
import LoginForm from "./login_form";
import { CheckXSRFToken } from "@/utilities/check_xsrf";
import { useNavigate } from "react-router";
import axios from "axios";
export default function Login() {
	// should do a faithful redirect if theres an xsrf token in the cookies or the user is already logged in

	const isAuthenticated = CheckXSRFToken();
	const navigate = useNavigate();

	const handleLogin = async () => {
		try {
		} catch (error) {}
	};
	React.useEffect(() => {
		if (isAuthenticated) {
			navigate("/dashboard");
		}
	}, [isAuthenticated, navigate]);
	return (
		<div className="min-h-screen flex items-center justify-center bg-muted">
			<LoginForm />
		</div>
	);
}
