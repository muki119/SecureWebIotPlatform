import { createContext } from "react";
import type { AuthClientRequest } from "@/helpers/client_request";
import type { TAuthState } from "@/types/auth_state";

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
