import React from "react";
import LoginForm from "./login_form";
export default function Login() {
	// should do a faithful redirect if theres an xsrf token in the cookies or the user is already logged in

	return (
		<div className="min-h-screen flex items-center justify-center bg-muted">
			<LoginForm />
		</div>
	);
}
