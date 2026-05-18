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

export default function SuccessfulResetCard() {
	const navigate = useNavigate();
	return (
		<Card className="w-full max-w-sm mx-auto">
			<CardHeader>
				<CardTitle>Password Reset Successful</CardTitle>
			</CardHeader>
			<CardContent>
				<CardDescription>
					Your password has been successfully reset. You can now log in with your
					new password.
				</CardDescription>
			</CardContent>
			<CardFooter>
				<Button className="w-full" onClick={() => navigate("/login")}>
					Go to Login
				</Button>
			</CardFooter>
		</Card>
	);
}
