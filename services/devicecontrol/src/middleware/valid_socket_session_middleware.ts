import type { Socket } from "socket.io";
import { logger } from "../config";
import { VerifyAccessToken } from "../helpers";

export const ErrAuthenticationInvalidToken =
	"Authentication error: Invalid token";
export async function ValidSocketSessionMiddleware(
	socket: Socket,
	next: (err?: Error) => void,
) {
	try {
		const token = socket.handshake.auth.token;
		if (!token) {
			return next(new Error("Authentication error: No token provided"));
		}
		const [payload, error] = await VerifyAccessToken(token);
		if (error) {
			logger.error(
				{ error: error },
				"Error verifying access token in ValidSocketSessionMiddleware:",
			);
			return next(new Error("Authentication error: Invalid token"));
		}
		if (!payload) {
			return next(new Error("Authentication error: Invalid token"));
		}
		socket.user = payload; // cba to extend for user payload
		const tokenExpiry = payload.exp * 1000 - Date.now();
		const timeout = setTimeout(() => {
			// disconnect socket when token expires - security measure
			socket.disconnect(true);
		}, tokenExpiry);

		socket.on("disconnect", (_reason) => {
			clearTimeout(timeout);
		});
		next();
	} catch (err) {
		logger.error({ error: err }, "Error in ValidSocketSessionMiddleware:");
		next(new Error("Authentication error"));
	}
}
