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

import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSeparator,
	FieldSet,
	FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginForm() {
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
				<form>
					<FieldGroup>
						<div id="inputs" className="flex flex-col gap-4">
							<div className="grid gap-4 mb-4">
								<Field>
									<FieldLabel htmlFor="email">Email</FieldLabel>
									<Input
										id="email"
										type="email"
										placeholder="you@anywhere.com"
										required={loginFormSchema.email.required}
									/>
								</Field>
							</div>
							<div className="grid gap-4">
								<Field>
									<div className="flex items-center">
										<FieldLabel htmlFor="password">Password</FieldLabel>
										<a
											href="#"
											className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
										>
											Forgot your password?
										</a>
									</div>
									<Input
										id="password"
										minLength={loginFormSchema.password.minLength}
										type="password"
										placeholder="********"
										required={loginFormSchema.password.required}
									/>
								</Field>
							</div>
						</div>
						<FieldError></FieldError>
					</FieldGroup>
				</form>
			</CardContent>
			<CardFooter>
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
			</CardFooter>
		</Card>
	);
}
