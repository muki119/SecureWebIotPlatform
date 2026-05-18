import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function ResetForm({ onReset, error }: {
	onReset: (password: string) => void;
	error: string | null;
}) {
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [localError, setLocalError] = useState<string | null>(null);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (password !== confirm) {
			setLocalError("Passwords do not match.");
			return;
		}
		setLocalError(null);
		onReset(password);
	};

	return (
		<Card className="w-full max-w-sm mx-auto">
			<CardHeader>
				<CardTitle>Reset Password</CardTitle>
				<CardDescription>Enter a new password for your account.</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit}>
					<FieldGroup>
						<FieldError>{localError ?? error}</FieldError>
						<div className="flex flex-col gap-4">
							<Field>
								<FieldLabel htmlFor="password">New Password</FieldLabel>
								<Input
									id="password"
									type="password"
									placeholder="Enter new password"
									required
									minLength={8}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="confirm">Confirm Password</FieldLabel>
								<Input
									id="confirm"
									type="password"
									placeholder="Confirm new password"
									required
									minLength={8}
									value={confirm}
									onChange={(e) => setConfirm(e.target.value)}
								/>
							</Field>
							<Button className="w-full" type="submit">
								Reset Password
							</Button>
						</div>
					</FieldGroup>
				</form>
			</CardContent>
			<CardFooter />
		</Card>
	);
}
