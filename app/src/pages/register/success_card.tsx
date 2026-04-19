import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function SuccessCard() {
	// just the card when the user has successfully registered

	return (
		<Card className="w-full max-w-sm mx-auto">
			<CardHeader>
				<CardTitle>Registration Successful</CardTitle>
			</CardHeader>
			<CardContent>
				<CardDescription>
					Your account has been successfully created. You can now login to your
					account.
				</CardDescription>
			</CardContent>
			<CardFooter>
				<Button className="w-full">Go to Login</Button>
			</CardFooter>
		</Card>
	);
}
