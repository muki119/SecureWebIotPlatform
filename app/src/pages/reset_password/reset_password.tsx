import ResetForm from "./reset_form";
import { useSearchParams } from "react-router";
import { useState } from "react";
import SuccessfulResetCard from "./successful_reset_card";
export default function ResetPassword() {
	// this is the form to reset the password
	// this is going to take a query param with the reset token

	const [searchParams] = useSearchParams();
	const resetToken = searchParams.get("token");
	const [isResetSuccessful, setIsResetSuccessful] = useState(false);
	return (
		<div className="min-h-screen flex items-center justify-center bg-muted">
			{isResetSuccessful ? <SuccessfulResetCard /> : <ResetForm />}
		</div>
	);
}
