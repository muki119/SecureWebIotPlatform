import { useState } from "react";
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
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordForm({
	onSubmit,
	error,
}: {
	onSubmit: (email: string) => void;
	error: string | null;
}) {
	const [email, setEmail] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(email.trim());
	};

	return (
		<Card className="w-full max-w-sm mx-auto">
			<CardHeader>
				<CardTitle>Forgot Password</CardTitle>
				<CardDescription>
					Enter your email to receive password reset instructions.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit}>
					<FieldGroup>
						<FieldError>{error}</FieldError>
						<Field>
							<FieldLabel htmlFor="email">Email</FieldLabel>
							<Input
								id="email"
								type="email"
								placeholder="you@example.com"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</Field>
						<Button className="w-full mt-4" type="submit">
							Send Reset Instructions
						</Button>
					</FieldGroup>
				</form>
			</CardContent>
			<CardFooter>
				<span className="text-sm text-center w-full">
					<a className="underline underline-offset-4" href="/login">
						Back to login
					</a>
				</span>
			</CardFooter>
		</Card>
	);
}
