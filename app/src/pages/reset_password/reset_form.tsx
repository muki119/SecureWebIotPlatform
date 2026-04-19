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

export default function ResetForm({ error }: { error?: string | undefined }) {
	return (
		<Card className="w-full max-w-sm mx-auto">
			<CardHeader>
				<CardTitle>Reset Password</CardTitle>
				<CardDescription>
					Input a new password for your account.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form>
					<FieldGroup>
						<div className="grid gap-2">
							<div className="grid gap-2">
								<Field>
									<FieldLabel htmlFor="password">New Password</FieldLabel>
									<Input
										id="password"
										type="password"
										placeholder="Enter new password"
									/>
									<FieldError>{error}</FieldError>
								</Field>
							</div>
						</div>
					</FieldGroup>
				</form>
			</CardContent>
			<CardFooter>
				<Button className="w-full">Reset Password</Button>
			</CardFooter>
		</Card>
	);
}
