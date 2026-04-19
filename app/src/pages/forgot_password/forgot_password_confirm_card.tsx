import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export default function ForgotPasswordConfirmCard() {
	return (
		<Card className="w-full max-w-sm mx-auto">
			<CardHeader>
				<CardTitle>Password Reset Instructions</CardTitle>
			</CardHeader>
			<CardContent>
				<CardDescription>
					If the email you entered is associated with an account, you will
					receive an email with instructions to reset your password. Please
					check your inbox and follow the instructions to reset your password.
				</CardDescription>
			</CardContent>
			<CardFooter>
				<Button className="w-full">Go to Login</Button>
			</CardFooter>
		</Card>
	);
}
