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

export default function SuccessfulResetCard() {
	return (
		<Card className="w-full max-w-sm mx-auto">
			<CardHeader>
				<CardTitle>Password Reset Successful</CardTitle>
			</CardHeader>
			<CardContent>
				<CardDescription>
					Your password has been successfully reset. You can now login with your
					new password.
				</CardDescription>
			</CardContent>
			<CardFooter>
				<Button className="w-full">Go to Login</Button>
			</CardFooter>
		</Card>
	);
}
