import { useReducer, createContext } from "react";
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
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

	const AuthContext = createContext<{
		authState: TAuthState;
		dispatch: React.Dispatch<TAuthState>;
	} | null>(null);

	return (
		<AuthContext.Provider value={{ authState, dispatch }}>
			{children}
		</AuthContext.Provider>
	);
}
