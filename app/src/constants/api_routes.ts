import { GetEnvVariable } from "@/utilities/get_env";

const BASE_URL = GetEnvVariable(
	"VITE_API_BASE_URL",
	"https://localhost/api/v1/",
); // base url is mainly for if their is a gateway being used , if not then the individual urls fro each service will have to be used
const AUTH_BASE_URL = GetEnvVariable("VITE_AUTH_BASE_URL", `${BASE_URL}auth/`); // should include port and /api/v1/*
const DOMAIN_BASE_URL = GetEnvVariable(
	"VITE_DOMAIN_BASE_URL",
	`${BASE_URL}domain/`,
);
const PROFILE_BASE_URL = GetEnvVariable(
	"VITE_PROFILE_BASE_URL",
	`${BASE_URL}profile/`,
);
const DEVICE_BASE_URL = GetEnvVariable(
	"VITE_DEVICE_BASE_URL",
	`${BASE_URL}device/`,
);
const LEDGER_BASE_URL = GetEnvVariable(
	"VITE_LEDGER_BASE_URL",
	`${BASE_URL}transactions/`,
);

export const SOCKET_URL = GetEnvVariable(
	"VITE_SOCKET_URL",
	"https://localhost/",
);
export const API_ROUTES = {
	AUTH: {
		LOGIN: { type: "POST", path: `${AUTH_BASE_URL}login/` },
		REGISTER: { type: "POST", path: `${AUTH_BASE_URL}register/` },
		LOGOUT: { type: "DELETE", path: `${AUTH_BASE_URL}logout` },
		REFRESH: { type: "GET", path: `${AUTH_BASE_URL}refresh/` },
		FORGOT_PASSWORD: {
			type: "POST",
			path: `${AUTH_BASE_URL}forgot-password/`,
		},
		RESET_PASSWORD: {
			type: "POST",
			path: `${AUTH_BASE_URL}reset-password/`,
		},
		CREDENTIAL_CHANGE: {
			type: "PATCH",
			path: `${AUTH_BASE_URL}credential-change/`,
		},
		ME: { type: "GET", path: `${AUTH_BASE_URL}me/` },
	},
	DOMAIN: {
		CREATE_DOMAIN: {
			type: "POST",
			path: `${DOMAIN_BASE_URL}`,
		},
		UPDATE_DOMAIN: (domainId: string) => ({
			type: "PATCH",
			path: `${DOMAIN_BASE_URL}${domainId}`,
		}),
		DELETE_DOMAIN: (domainId: string) => ({
			type: "DELETE",
			path: `${DOMAIN_BASE_URL}${domainId}`,
		}),
		LEAVE_DOMAIN: (domainId: string) => ({
			type: "POST",
			path: `${DOMAIN_BASE_URL}${domainId}/leave`,
		}),
		ADD_USER: (domainId: string) => ({
			type: "POST",
			path: `${DOMAIN_BASE_URL}${domainId}/user`,
		}),
		DELETE_USER: (domainId: string, userId: string) => ({
			type: "DELETE",
			path: `${DOMAIN_BASE_URL}${domainId}/user/${userId}`,
		}),
		UPDATE_USER_ROLE: (domainId: string, userId: string) => ({
			type: "PATCH",
			path: `${DOMAIN_BASE_URL}${domainId}/user/${userId}/role`,
		}),
		GET_DOMAIN_USERS: (domainId: string) => ({
			type: "GET",
			path: `${DOMAIN_BASE_URL}${domainId}/users`,
		}),
		GET_USER_DOMAINS: {
			type: "GET",
			path: `${DOMAIN_BASE_URL}`,
		},
	},
	PROFILE: {
		GET_USER_PROFILE: {
			type: "GET",
			path: `${PROFILE_BASE_URL}me/`,
		},
		SEARCH_USERS: {
			type: "GET",
			path: `${PROFILE_BASE_URL}search/`,
		},
		UPDATE_PROFILE: {
			type: "PATCH",
			path: `${PROFILE_BASE_URL}me/`,
		},
		GET_PROFILE: (userId: string) => ({
			type: "GET",
			path: `${PROFILE_BASE_URL}${userId}/`,
		}),
	},
	DEVICE: {
		CREATE_PAIRING_CODE: (domainId: string) => ({
			type: "POST",
			path: `${DEVICE_BASE_URL}domain/${domainId}/pair`,
		}),
		GET_DOMAIN_DEVICES: (domainId: string) => ({
			type: "GET",
			path: `${DEVICE_BASE_URL}domain/${domainId}/`,
		}),
		DELETE_DEVICE: (deviceId: string) => ({
			type: "DELETE",
			path: `${DEVICE_BASE_URL}${deviceId}`,
		}),
		UPDATE_DEVICE: (deviceId: string) => ({
			type: "PATCH",
			path: `${DEVICE_BASE_URL}${deviceId}`,
		}),
		GET_DEVICE_TELEMETRY: (deviceId: string) => ({
			type: "GET",
			path: `${DEVICE_BASE_URL}${deviceId}/telemetry`,
		}),
	},
	LEDGER: {
		DOMAIN_LEDGER: (domainId: string) => ({
			type: "GET",
			path: `${LEDGER_BASE_URL}${domainId}/`,
		}),
	},
};

export const SOCKET_EVENTS = {
	CLIENT_EMITTED: {
		DEVICE_CONTROL: {
			// client emitted
			UPDATE: "DEVICE_CONTROL_UPDATE", // this is emitted to the device when a user updates capability  of a device (ie is controlling something ) - should follow {deviceId,domainId, changes:{capability:string, value:any} } // has to be debounced on client so micro changes dont kill backend  - might have to be acked
		},
	},

	SERVER_EMITTED: {
		// most/all of these events are emitted to rooms without ack because they are to be real time and ack isnt necessary and isnt performant
		DOMAIN: {
			// these events are emitted to the room  , all follows {domainid ,userid} // server emitted
			USER_REMOVED: "DOMAIN_USER_REMOVED", // WHEN A USER other than yourself is removed from a domain , just send the user id , the domain id is from the room they are in
			USER_ADDED: "DOMAIN_USER_ADDED", // {domainid, userid} when a user is added to a domain
			USER_ROLE_UPDATED: "DOMAIN_USER_ROLE_UPDATED",
			DELETED: "DOMAIN_DELETED", // when the domain is deleted by the owner
		},
		DEVICE: {
			// this isnt a room but is emitted under the domains , needs to follow {domainid , deviceid} - this is server emitted
			ADDED: "DEVICE_ADDED", //{domainid, deviceid , the device details}
			REMOVED: "DEVICE_REMOVED", // {domainid, deviceid}
			DEVICE_INFO_UPDATED: "DEVICE_INFO_UPDATED", // when device information like name or location is updated , this is emitted with {domainid, deviceid, changes:{name?:string, location?:string} }
			UPDATED: "DEVICE_UPDATED", // shoudld probably follow the patch pattern of {capability:string , value:any}  so , {deviceId, changes:{capability:string, value:any} } // this is when a user updates a device capability and this is what the server sends to the clients in the domain - should be broadcasted
			TELEMETRY: "DEVICE_TELEMETRY", // is just {domainid, deviceId, data:{capability:string, value:any} }-  emitted when a device sends new telemetry data
			STATUS: "DEVICE_STATUS", // {domainId, deviceId, online: boolean}
		},
		USER: {
			// user will connect to its own room which is its userid , needs to only folow {userid,domainid} // server emitted
			JOINED_DOMAIN: "USER_JOINED_DOMAIN", // when a user is added to a domain
			LEFT_DOMAIN: "USER_LEFT_DOMAIN", // when removed from a domain
			ROLE_UPDATED: "USER_ROLE_UPDATED", // when role is updated in a domain
		},
	},
};
