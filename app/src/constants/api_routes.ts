import { GetEnvVariable } from "@/utilities/get_env";


const BASE_URL = GetEnvVariable("VITE_API_BASE_URL", "http://localhost/api/v1/"); // base url is mainly for if their is a gateway being used , if not then the individual urls fro each service will have to be used
const AUTH_BASE_URL = GetEnvVariable("VITE_AUTH_BASE_URL", `${BASE_URL}auth/`); // should include port and /api/v1/*
const DOMAIN_BASE_URL = GetEnvVariable("VITE_DOMAIN_BASE_URL", `${BASE_URL}domains/`)
const PROFILE_BASE_URL = GetEnvVariable("VITE_PROFILE_BASE_URL", `${BASE_URL}profiles/`)
const DEVICE_BASE_URL = GetEnvVariable("VITE_DEVICE_BASE_URL", `${BASE_URL}devices/`)

export const API_ROUTES = {
    AUTH: {
        LOGIN: { type: "POST", path: `${AUTH_BASE_URL}login/` },
        REGISTER: { type: "POST", path: `${AUTH_BASE_URL}register/` },
        LOGOUT: { type: "DELETE", path: `${AUTH_BASE_URL}logout/` },
        REFRESH: { type: "GET", path: `${AUTH_BASE_URL}refresh/` },
        FORGOT_PASSWORD: { type: "POST", path: `${AUTH_BASE_URL}forgot-password/` },
        RESET_PASSWORD: { type: "POST", path: `${AUTH_BASE_URL}reset-password/` },
        CREDENTIAL_CHANGE: { type: "PATCH", path: `${AUTH_BASE_URL}credential-change/` },
        ME: { type: "GET", path: `${AUTH_BASE_URL}me/` }
    },
    DOMAIN: {
        CREATE_DOMAIN: {
            type: "POST",
            path: `${DOMAIN_BASE_URL}`
        },
        UPDATE_DOMAIN: (domainId: string) => ({
            type: "PATCH",
            path: `${DOMAIN_BASE_URL}${domainId}`
        }),
        DELETE_DOMAIN: (domainId: string) => ({
            type: "DELETE",
            path: `${DOMAIN_BASE_URL}${domainId}`
        }),
        LEAVE_DOMAIN: (domainId: string) => ({
            type: "POST",
            path: `${DOMAIN_BASE_URL}${domainId}/leave`
        }),
        ADD_USER: (domainId: string) => ({
            type: "POST",
            path: `${DOMAIN_BASE_URL}${domainId}/user`
        }),
        DELETE_USER: (domainId: string, userId: string) => ({
            type: "DELETE",
            path: `${DOMAIN_BASE_URL}${domainId}/user/${userId}`
        }),
        UPDATE_USER_ROLE: (domainId: string, userId: string) => ({
            type: "PATCH",
            path: `${DOMAIN_BASE_URL}${domainId}/user/${userId}/role`
        }),
        GET_DOMAIN_USERS: (domainId: string) => ({
            type: "GET",
            path: `${DOMAIN_BASE_URL}${domainId}/users`
        }),
        GET_USER_DOMAINS: {
            type: "GET",
            path: `${DOMAIN_BASE_URL}`
        }

    },
    PROFILE: {
        GET_USER_PROFILE: {
            type: "GET",
            path: `${PROFILE_BASE_URL}me/`
        },
        SEARCH_USERS: {
            type: "GET",
            path: `${PROFILE_BASE_URL}search/`
        },
        UPDATE_PROFILE: {
            type: "PATCH",
            path: `${PROFILE_BASE_URL}me/`
        },
        GET_PROFILE: (userId: string) => ({
            type: "GET",
            path: `${PROFILE_BASE_URL}${userId}/`
        })

    },
    DEVICE: {
        CREATE_PAIRING_CODE: (domainId: string) => ({
            type: "POST",
            path: `${DEVICE_BASE_URL}domain/${domainId}/pair`
        }),
        GET_DOMAIN_DEVICES: (domainId: string) => ({
            type: "GET",
            path: `${DEVICE_BASE_URL}domain/${domainId}/`
        }),
        DELETE_DEVICE: (deviceId: string) => ({
            type: "DELETE",
            path: `${DEVICE_BASE_URL}${deviceId}`
        }),
        UPDATE_DEVICE: (deviceId: string) => ({
            type: "PATCH",
            path: `${DEVICE_BASE_URL}${deviceId}`
        }),
        GET_DEVICE_TELEMETRY: (deviceId: string) => ({
            type: "GET",
            path: `${DEVICE_BASE_URL}${deviceId}/telemetry`
        })


    }
}