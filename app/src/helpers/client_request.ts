

import axios, { isAxiosError } from "axios";
import type { AxiosRequestConfig, AxiosResponse, CreateAxiosDefaults, AxiosInstance } from "axios";
import { type Result } from "@/types/result";

/**
 * Whole point of this class is a abstraction that automatically attempts to refresh the access token 
 * this is only for authenticated requests that need an access token
 */
export class AuthClientRequest {
    private refreshUrl: string
    private retryCount: number
    private axiosInstance: AxiosInstance
    static ErrInvalidRefreshToken = new Error("Invalid refresh token, please login again")
    static ErrUnauthorized = new Error("Unauthorized, refresh failed or max retries reached")
    static ErrServerError = new Error("Server error while refreshing token")

    constructor(refreshUrl: string, retryCount = 1, config?: CreateAxiosDefaults) {
        this.refreshUrl = refreshUrl;
        this.retryCount = retryCount;
        this.refreshPromise = null; // initialize the refresh promise to null
        this.axiosInstance = axios.create({ withCredentials: true, ...config });
    }

    protected refreshPromise: Promise<Result<boolean>> | null // this is like in java , making it so theres only one refresh request - same in java for only one thread for a certain thing can exist at a time

    async refresh(): Promise<Result<boolean>> { // should return boolean indicating if its success full

        if (this.refreshPromise) { // if theres already a refresh request in progress then wait for it to finish and return the result of that instead of making a new request
            return this.refreshPromise;
        }

        this.refreshPromise = (async () => { // if there isnt a request in progress then make a new one
            try {
                await this.axiosInstance.get(this.refreshUrl, { withCredentials: true }); // make the refresh request with credentials to include the refresh token cookie
                return [true, null];
            } catch (error) {
                if (isAxiosError(error) && error.response) { // if a error was returned
                    if (error.response.status === 401) { // if tokens are invalid or whatnot then we need to force login
                        return [null, AuthClientRequest.ErrInvalidRefreshToken];
                    } else if (error.response.status === 500) {
                        return [null, AuthClientRequest.ErrServerError];
                    }
                }
                return [null, new Error("Error refreshing access token", { cause: error })];
            }
        })();

        return this.refreshPromise; // return the promise for the request 
    }

    protected async performRequest(func: () => Promise<AxiosResponse>, retry = this.retryCount): Promise<Result<AxiosResponse>> {
        try {
            const r = await func();
            return [r, null];
        } catch (error) {
            if (isAxiosError(error)) {
                if (error.response?.status === 401) { // Unauthorized 
                    const [, err] = await this.refresh(); // refresh the access token
                    if (err) {
                        return [null, err]; // if there was an error refreshing then return the error and dont attempt to retry
                    }
                    if (retry) { // if theres retries left attempt to retry
                        return this.performRequest(func, retry - 1); // attempt to perform the request again with one less retry
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
        } finally {
            this.refreshPromise = null;
        }

    }

    async post(url: string, data?: unknown, config?: AxiosRequestConfig, retry = this.retryCount) {
        return this.performRequest(() => this.axiosInstance.post(url, data, config), retry);
    }

    async get(url: string, config?: AxiosRequestConfig, retry = this.retryCount) {
        return this.performRequest(() => this.axiosInstance.get(url, config), retry);
    }

    async delete(url: string, config?: AxiosRequestConfig, retry = this.retryCount) {
        return this.performRequest(() => this.axiosInstance.delete(url, config), retry);
    }

    async patch(url: string, data?: unknown, config?: AxiosRequestConfig, retry = this.retryCount) {
        return this.performRequest(() => this.axiosInstance.patch(url, data, config), retry);
    }

}
