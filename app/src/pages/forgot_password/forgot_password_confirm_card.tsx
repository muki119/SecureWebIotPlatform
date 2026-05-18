import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router";

export default function ForgotPasswordConfirmCard() {
	const navigate = useNavigate();
	return (
		<Card className="w-full max-w-sm mx-auto">
			<CardHeader>
				<CardTitle>Check your inbox</CardTitle>
			</CardHeader>
			<CardContent>
				<CardDescription>
					If the email you entered is associated with an account, you will
					receive instructions to reset your password. Please check your inbox
					and follow the link provided.
				</CardDescription>
			</CardContent>
			<CardFooter>
				<Button className="w-full" onClick={() => navigate("/login")}>
					Back to Login
				</Button>
			</CardFooter>
		</Card>
	);
}
