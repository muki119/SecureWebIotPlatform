import { useReducer, useRef, useCallback } from "react";
import { AuthClientRequest } from "@/helpers/client_request";
import { AuthContext, AuthUserState } from "./auth_context";
import { API_ROUTES } from "@/constants/api_routes";
import type { AxiosResponse } from "axios";

export function AuthContextProvider({
	children,
}: {
	children: React.ReactNode;
}) {
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

	const refreshCallback = async (refreshData: AxiosResponse) => {
		const newAccessToken = refreshData.data.accessToken;
		await dispatch({
			type: "REFRESH_TOKEN",
			payload: { accessToken: newAccessToken },
		});
	};

	const authClientRequest = useRef<AuthClientRequest>(
		new AuthClientRequest(API_ROUTES.AUTH.REFRESH.path, refreshCallback),
	);

	const Logout = useCallback(async () => {
		dispatch({
			type: "LOGOUT",
		});
	}, []);

	return (
		<AuthContext.Provider
			value={{ authState, dispatch, authClientRequest, Logout }}
		>
			{children}
		</AuthContext.Provider>
	);
}
