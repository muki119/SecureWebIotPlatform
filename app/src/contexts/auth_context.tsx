import { useReducer, createContext } from "react";
import { AuthClientRequest } from "@/helpers/client_request";
import { API_ROUTES } from "@/constants/api_routes";
import type { AxiosResponse } from "axios";
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
const AuthUserState: TAuthState = {
	isAuthenticated: false,
	user: null,
	accessToken: null,
};

export const AuthContext = createContext<
	| {
			authState: TAuthState;
			dispatch: React.Dispatch<unknown>;
			authClientRequest: AuthClientRequest;
	  }
	| undefined
>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const refreshCallback = async (refreshData: AxiosResponse) => {
		const newAccessToken = refreshData.data.accessToken;
		await dispatch({
			type: "REFRESH_TOKEN",
			payload: { accessToken: newAccessToken },
		});
	};

	const authClientRequest = new AuthClientRequest(
		API_ROUTES.AUTH.REFRESH.path,
		refreshCallback,
	);
	const Logout = async () => {
		const _ = authClientRequest.logout(API_ROUTES.AUTH.LOGOUT.path);
	};
	const [authState, dispatch] = useReducer((state, action) => {
		switch (action.type) {
			case "LOGIN":
				return {
					...state,
					isAuthenticated: true,
					user: null,
					accessToken: action.payload.accessToken,
				};

			case "REFRESH_TOKEN":
				return {
					...state,
					accessToken: action.payload.accessToken,
				};
			case "LOGOUT":
				Logout();
				return {
					...state,
					isAuthenticated: false,
					user: null,
					accessToken: null,
				};
			case "SET_USER":
				return {
					...state,
					user: action.payload.user,
				};
			default:
				return state;
		}
	}, AuthUserState);

	return (
		<AuthContext.Provider value={{ authState, dispatch, authClientRequest }}>
			{children}
		</AuthContext.Provider>
	);
}
