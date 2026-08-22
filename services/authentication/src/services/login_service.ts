import { userModel } from "../models/user_model";
import { VerifyPassword } from "../utilities/password_hash";
export default async function LoginService(
	email: string,
	password: string,
): Promise<string | null> {
	// should really just return the uuid -- beacuse the users infomation will be pulled on another route lke a /me
	try {
		const user = await userModel.findByEmail(email);
		if (!user) {
			return null; // user not found - null used as truthy false
		}
		const isPasswordValid = await VerifyPassword(password, user.password);
		if (!isPasswordValid) {
			return null; // return null because password invalid. - no need to return specifics because the sever will return "invalid email/password" anyway
		}
		return user.id; // return the user's id if login is successful
	} catch (error) {
		throw new Error("Error in login service", { cause: error });
	}
}
