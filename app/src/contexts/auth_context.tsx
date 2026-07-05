import { AuthClientRequest } from "@/helpers/client_request";
import { createContext } from "react";

/**
 * This is going to hold the authentication state of the user
 * when logged in this will hold the access token and userInfo
 *
 * no need for token to be in local storage since it better for it to not be persisted
 */

type TAuthState = {
	isAuthenticated: boolean;
	user: Record<string, string | number | boolean | Date> | null;
	accessToken: string | null;
};
export const AuthUserState: TAuthState = {
	isAuthenticated: false,
	user: null,
	accessToken: null,
};
export const AuthContext = createContext<
	| {
			authState: TAuthState;
			dispatch: React.Dispatch<unknown>;
			authClientRequest: React.RefObject<AuthClientRequest>;
			Logout: () => Promise<void>;
	  }
	| undefined
>(undefined);
