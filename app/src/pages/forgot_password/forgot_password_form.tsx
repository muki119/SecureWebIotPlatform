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

export default function ForgotPasswordForm() {
	return (
		<Card className="w-full max-w-sm mx-auto">
			<CardHeader>
				<CardTitle>Forgot Password</CardTitle>
				<CardDescription>
					Enter your email to receive password reset instructions.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form>
					<FieldGroup>
						<div className="grid gap-2">
							<div className="grid gap-2">
								<Field>
									<FieldLabel htmlFor="email">Email</FieldLabel>
									<Input
										id="email"
										type="email"
										placeholder="you@example.com"
									/>
								</Field>
							</div>
						</div>
					</FieldGroup>
				</form>
			</CardContent>
			<CardFooter>
				<Button className="w-full">Send Reset Instructions</Button>
			</CardFooter>
		</Card>
	);
}
