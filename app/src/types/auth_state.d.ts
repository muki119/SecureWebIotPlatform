/**
 * This is going to hold the authentication state of the user
 * when logged in this will hold the access token and userInfo
 *
 * no need for token to be in local storage since it better for it to not be persisted
 */

export type TAuthState = {
	isAuthenticated: boolean;
	user: UserInfo | null;
	accessToken: string | null;
};

export type UserInfo = {
	userId: string;
	email: string;
	name: string;
};
