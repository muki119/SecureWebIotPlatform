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

export default function LoginForm({
	userCredentials,
	handleInputChange,
	handleLogin,
	loginError,
}: {
	userCredentials: {
		email: string;
		password: string;
	};
	handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleLogin: (e: React.SubmitEvent<HTMLFormElement>) => void;
	loginError: string | null;
}) {
	const loginFormSchema = {
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
				<CardTitle>Login to your account</CardTitle>
				<CardDescription>
					Enter your email and password to login
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleLogin} className="w-full">
					<FieldGroup>
						<FieldError>{loginError}</FieldError>
						<div id="inputs" className="flex flex-col gap-4">
							<div className="grid gap-4 mb-4">
								<Field>
									<FieldLabel htmlFor="email">Email</FieldLabel>
									<Input
										id="email"
										type="email"
										name="email"
										placeholder="you@anywhere.com"
										required={loginFormSchema.email.required}
										value={userCredentials.email}
										onChange={handleInputChange}
									/>
								</Field>
							</div>
							<div className="grid gap-4">
								<Field>
									<div className="flex items-center">
										<FieldLabel htmlFor="password">Password</FieldLabel>
										<a
											href="/forgot-password"
											className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
										>
											Forgot your password?
										</a>
									</div>
									<Input
										id="password"
										minLength={loginFormSchema.password.minLength}
										type="password"
										name="password"
										placeholder="********"
										required={loginFormSchema.password.required}
										value={userCredentials.password}
										onChange={handleInputChange}
									/>
								</Field>
							</div>
							<div className="flex flex-col gap-4 w-full items-center">
								<Button className="w-full">Login</Button>
								<span>
									Don&apos;t have an account?{" "}
									<a
										className="ml-auto inline-block text-sm underline-offset-4 underline"
										href="/register"
									>
										Create an account
									</a>
								</span>
							</div>
						</div>
					</FieldGroup>
				</form>
			</CardContent>
			<CardFooter></CardFooter>
		</Card>
	);
}
