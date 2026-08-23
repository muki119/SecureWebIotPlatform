import "socket.io";
import type { AccessTokenClaims } from "../../../common/types/tokens";

declare module "socket.io" {
	interface Socket {
		user?: AccessTokenClaims;
	}
}
