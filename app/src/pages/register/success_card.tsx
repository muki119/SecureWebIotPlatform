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

export default function SuccessCard() {
	const navigate = useNavigate();
	return (
		<Card className="w-full max-w-sm mx-auto">
			<CardHeader>
				<CardTitle>Registration Successful</CardTitle>
			</CardHeader>
			<CardContent>
				<CardDescription>
					Your account has been successfully created. You can now log in.
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
