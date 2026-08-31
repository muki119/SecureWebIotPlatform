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
import useDebounce from "@/hooks/use-debounce";

export default function RegisterForm({
	onRegister,
	error,
	loading,
}: {
	onRegister: (
		forename: string,
		surname: string,
		email: string,
		password: string,
	) => void;
	error: string | null;
	loading: boolean;
}) {
	const [form, setForm] = useState({
		forename: "",
		surname: "",
		email: "",
		password: "",
	});

	const handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void = (
		e,
	) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const debouncedRegister = useDebounce(onRegister, 500);

	const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		debouncedRegister(
			form.forename.trim(),
			form.surname.trim(),
			form.email.trim(),
			form.password,
		);
	};

	return (
		<Card className="w-full max-w-sm mx-auto">
			<CardHeader>
				<CardTitle>Register for an account</CardTitle>
				<CardDescription>
					Enter your details to create an account
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit}>
					<FieldGroup>
						<FieldError>{error}</FieldError>
						<div className="flex flex-col gap-4">
							<Field>
								<FieldLabel htmlFor="forename">
									Forename
								</FieldLabel>
								<Input
									id="forename"
									name="forename"
									type="text"
									placeholder="Avery"
									required
									minLength={2}
									value={form.forename}
									onChange={handleChange}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="surname">
									Surname
								</FieldLabel>
								<Input
									id="surname"
									name="surname"
									type="text"
									placeholder="Bradley"
									required
									minLength={2}
									value={form.surname}
									onChange={handleChange}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="email">Email</FieldLabel>
								<Input
									id="email"
									name="email"
									type="email"
									placeholder="you@anywhere.com"
									required
									value={form.email}
									onChange={handleChange}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="password">
									Password
								</FieldLabel>
								<Input
									id="password"
									name="password"
									type="password"
									placeholder="********"
									required
									minLength={8}
									value={form.password}
									onChange={handleChange}
								/>
							</Field>
							<Button
								className="w-full"
								type="submit"
								disabled={loading}
							>
								{loading ? "Registering..." : "Register"}
							</Button>
						</div>
					</FieldGroup>
				</form>
			</CardContent>
			<CardFooter>
				<span className="text-sm text-center w-full">
					Already have an account?{" "}
					<a className="underline underline-offset-4" href="/login">
						Log in
					</a>
				</span>
			</CardFooter>
		</Card>
	);
}
