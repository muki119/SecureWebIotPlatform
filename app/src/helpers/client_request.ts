

import axios, { isAxiosError } from "axios";
import type { AxiosRequestConfig, AxiosResponse, CreateAxiosDefaults, AxiosInstance } from "axios";
import { GetCookie } from "@/utilities/check_xsrf";
import type { Result } from "../types/result";
import { XSRF_TOKEN_COOKIE } from "@/constants/xsrf_token";

/**
 * Whole point of this class is a abstraction that automatically attempts to refresh the access token 
 * this is only for authenticated requests that need an access token
 */


export type RefreshCallback = (refreshData: AxiosResponse) => void;
export class AuthClientRequest {
    private refreshUrl: string
    private retryCount: number
    private axiosInstance: AxiosInstance
    private refreshCallback: RefreshCallback; // callback becasue the token needs to be stored in state so the app can 
    static ErrInvalidRefreshToken = new Error("Invalid refresh token, please login again")
    static ErrUnauthorized = new Error("Unauthorized, refresh failed or max retries reached") // for 401s only  -- 400 is a bad request only
    static ErrServerError = new Error("Server error while refreshing token")

    constructor(refreshUrl: string, refreshCallback: RefreshCallback, retryCount = 1, config?: CreateAxiosDefaults) {
        this.refreshUrl = refreshUrl;
        this.refreshCallback = refreshCallback;
        this.retryCount = retryCount;
        this.refreshPromise = null; // initialize the refresh promise to null
        this.axiosInstance = axios.create({ withCredentials: true, ...config });
    }

    protected refreshPromise: Promise<Result<string>> | null // this is like in java , making it so theres only one refresh request - same in java for only one thread for a certain thing can exist at a time

    async refresh(): Promise<Result<string>> { // should return boolean indicating if its success full
        if (this.refreshPromise) { // if theres already a refresh request in progress then wait for it to finish and return the result of that instead of making a new request
            return this.refreshPromise;
        }
        this.refreshPromise = (async () => { // if there isnt a request in progress then make a new one
            try {
                const xsrfToken = GetCookie(XSRF_TOKEN_COOKIE);
                if (!xsrfToken) {
                    return [null, AuthClientRequest.ErrUnauthorized];
                }
                const r = await this.axiosInstance.get(this.refreshUrl, {
                    withCredentials: true, headers: {
                        "x-xsrf-token": xsrfToken
                    }
                }); // make the refresh request with credentials to include the refresh token cookie
                await this.refreshCallback(r); // call the callback to update the access token in state
                return [r.data.accessToken, null];
            } catch (error) {
                if (isAxiosError(error) && error.response) { // if a error was returned
                    if (error.response.status === 401) { // if tokens are invalid or whatnot then we need to force login
                        return [null, AuthClientRequest.ErrInvalidRefreshToken];
                    } else if (error.response.status === 500) {
                        return [null, AuthClientRequest.ErrServerError];
                    }
                }
                return [null, new Error("Error refreshing access token", { cause: error })];
            } finally {
                this.refreshPromise = null;
            }
        })();

        return this.refreshPromise; // return the promise for the request 
    }

    protected async performRequest(func: (accessToken?: string) => Promise<AxiosResponse>, retry = this.retryCount): Promise<Result<AxiosResponse>> {
        try {
            const r = await func();
            return [r, null];
        } catch (error) {
            if (isAxiosError(error)) {
                if (error.response?.status === 401) { // Unauthorized 
                    const [newAccessToken, err] = await this.refresh(); // refresh the access token - get the new access token  because it cant pull from the context directly since the config only gets the resolved version which dosnet have the new access token
                    if (err) {
                        return [null, err]; // if there was an error refreshing then return the error and dont attempt to retry
                    }
                    if (retry) { // if theres retries left attempt to retry
                        return this.performRequest(() => func(AuthClientRequest.createAuthHeader(newAccessToken!)), retry - 1); // attempt to perform the request again with one less retry
                    }
                    return [null, AuthClientRequest.ErrUnauthorized];
                } else if (error.response?.status === 500) {
                    return [null, AuthClientRequest.ErrServerError];
                }
                if (error.response) { // if it ras a response error from the server , axios loves to throw errors for any status code not 200 
                    return [error.response, null]; // return the response data as the result, this way the frontend can handle the error based on the status code and message from the server
                }

            }
            return [null, new Error("Error making post request", { cause: error })];
        }

    }

    static createAuthHeader(accessToken?: string) {
        return accessToken ? `Bearer ${accessToken}` : undefined;
    }

    async post(url: string, data?: unknown, config?: AxiosRequestConfig, retry = this.retryCount) {
        return this.performRequest((accessTokenHeader) => {
            return this.axiosInstance.post(url, data, { ...config, headers: { ...config?.headers, Authorization: accessTokenHeader ? accessTokenHeader : config?.headers?.Authorization } })
        }, retry);
    }

    async get(url: string, config?: AxiosRequestConfig, retry = this.retryCount) {
        return this.performRequest((accessTokenHeader) => {
            return this.axiosInstance.get(url, { ...config, headers: { ...config?.headers, Authorization: accessTokenHeader ? accessTokenHeader : config?.headers?.Authorization } })
        }, retry);
    }

    async delete(url: string, config?: AxiosRequestConfig, retry = this.retryCount) {
        return this.performRequest((accessTokenHeader) => {
            return this.axiosInstance.delete(url, { ...config, headers: { ...config?.headers, Authorization: accessTokenHeader ? accessTokenHeader : config?.headers?.Authorization } })
        }, retry);
    }

    async patch(url: string, data?: unknown, config?: AxiosRequestConfig, retry = this.retryCount) {
        return this.performRequest((accessTokenHeader) => {
            return this.axiosInstance.patch(url, data, { ...config, headers: { ...config?.headers, Authorization: accessTokenHeader ? accessTokenHeader : config?.headers?.Authorization } })
        }, retry);
    }


    async login(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<Result<AxiosResponse>> {
        try {
            const r = await this.axiosInstance.post(url, data, config);
            return [r, null];
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                return [error.response, null]; // return the response data as the result, this way the frontend can handle the error based on the status code and message from the server
            }
            return [null, new Error("Error making post request", { cause: error })];
        }
    }

    async logout(url: string, config?: AxiosRequestConfig): Promise<Result<AxiosResponse>> {
        try {
            const r = await this.axiosInstance.delete(url, config);
            return [r, null];
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                return [error.response, null]; // return the response data as the result, this way the frontend can handle the error based on the status code and message from the server
            }
            return [null, new Error("Error making logout request", { cause: error })];
        }
    }

}
