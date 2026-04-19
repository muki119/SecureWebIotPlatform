import { useState } from "react";
import RegisterForm from "./register_form";
import SuccessCard from "./success_card";

export default function Register() {
	const [isRegistered, setIsRegistered] = useState(false);

	return (
		<div className="min-h-screen flex items-center justify-center bg-muted">
			{isRegistered ? <SuccessCard /> : <RegisterForm />}
		</div>
	);
}
