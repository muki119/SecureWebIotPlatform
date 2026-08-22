import { randomBytes, randomInt } from "node:crypto";
import { PASSWORD_CONSTRAINTS } from "../src/utilities/password_hash";

export const generatePassword = (length: number) => {
	return randomBytes(length).toString("base64url").slice(0, length); // slice to ensure the password is exactly the desired length
};

/**
 * @param quantity
 * @description generates an ammount of random passwords with the chances of them being invalid based on the PASSWORD_CONSTRAINTS
 */
export function generateRandomPasswords(quantity: number) {
	const passwords: { password: string; valid: boolean }[] = [];
	for (let i = 0; i < quantity; i++) {
		const passwordLength = randomInt(
			PASSWORD_CONSTRAINTS.minLength,
			PASSWORD_CONSTRAINTS.maxLength + 1,
		); // generate passwords that are between 1 and 10 characters longer than the minimum length
		const password = generatePassword(passwordLength);
		passwords.push({
			password,
			valid:
				password.length >= PASSWORD_CONSTRAINTS.minLength &&
				password.length <= PASSWORD_CONSTRAINTS.maxLength,
		});
	}
	return passwords;
}
