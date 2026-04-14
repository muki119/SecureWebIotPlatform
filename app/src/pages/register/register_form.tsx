import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterForm() {
	const registerFormSchema = {
		names: {
			type: "string",
			required: true,
			minLength: 2,
		},
		email: {
			type: "string",
			required: true,
		},
		password: {
			minLength: 8,
			type: "string",
			required: true,
		},
	};
	return (
		<Card className="w-full max-w-sm mx-auto">
			<CardHeader>
				<CardTitle>Register for an account</CardTitle>
				<CardDescription>Enter your credentials to register</CardDescription>
			</CardHeader>
			<CardContent>
				<form>
					<div id="inputs" className="flex flex-col gap-4">
						<div className="grid gap-3 mb-4">
							<Label> Forename</Label>
							<Input
								id="forename"
								type="text"
								placeholder="Avery"
								required={registerFormSchema.names.required}
							/>
							<Label> Surname</Label>
							<Input
								id="surname"
								type="text"
								placeholder="Bradley"
								required={registerFormSchema.names.required}
							/>
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="you@anywhere.com"
								required={registerFormSchema.email.required}
							/>
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								minLength={registerFormSchema.password.minLength}
								type="password"
								placeholder="********"
								required={registerFormSchema.password.required}
							/>
						</div>
					</div>
				</form>
			</CardContent>
			<CardFooter>
				<div className="flex flex-col gap-4 w-full items-center">
					<Button className="w-full">Register</Button>
					<span>
						Already have an account?{" "}
						<a
							className="ml-auto inline-block text-sm underline-offset-4 underline"
							href="/login"
						>
							Log in to your account
						</a>
					</span>
				</div>
			</CardFooter>
		</Card>
	);
}
