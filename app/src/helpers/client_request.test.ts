import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { XSRF_TOKEN_COOKIE } from "@/constants/xsrf_token";
import { AuthClientRequest } from "./client_request";

const { axiosInstance, getCookie } = vi.hoisted(() => ({
    axiosInstance: {
        delete: vi.fn(),
        get: vi.fn(),
        patch: vi.fn(),
        post: vi.fn(),
    },
    getCookie: vi.fn(),
}));

vi.mock("axios", () => ({
    default: {
        create: vi.fn(() => axiosInstance),
    },
    isAxiosError: (error: unknown) =>
        typeof error === "object" && error !== null && "isAxiosError" in error,
}));

vi.mock("@/utilities/check_xsrf", () => ({
    GetCookie: getCookie,
}));

function axiosError(status?: number) {
    return {
        isAxiosError: true,
        response: status === undefined ? undefined : { status },
    };
}

describe("AuthClientRequest", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getCookie.mockReturnValue("xsrf-token");
    });

    it("uses the supplied authorization header for a successful request", async () => {
        const response = { data: { ok: true } } as AxiosResponse;
        axiosInstance.post.mockResolvedValue(response);
        const client = new AuthClientRequest("/refresh", vi.fn());

        const result = await client.post(
            "/devices",
            { power: true },
            {
                headers: { Authorization: "Bearer existing-token" },
            },
        );

        expect(result).toEqual([response, null]);
        expect(axiosInstance.post).toHaveBeenCalledWith(
            "/devices",
            { power: true },
            expect.objectContaining({
                headers: { Authorization: "Bearer existing-token" },
            }),
        );
    });

    it("refreshes and retries a request that receives a 401", async () => {
        const refreshedResponse = {
            data: { accessToken: "new-token" },
        } as AxiosResponse;
        const retriedResponse = { data: { ok: true } } as AxiosResponse;
        const refreshCallback = vi.fn();
        axiosInstance.get
            .mockRejectedValueOnce(axiosError(401))
            .mockResolvedValueOnce(refreshedResponse)
            .mockResolvedValueOnce(retriedResponse);
        const client = new AuthClientRequest("/refresh", refreshCallback);

        const result = await client.get("/devices", {
            headers: { Authorization: "Bearer expired-token" },
        });

        expect(result).toEqual([retriedResponse, null]);
        expect(axiosInstance.get).toHaveBeenNthCalledWith(2, "/refresh", {
            withCredentials: true,
            headers: { "x-xsrf-token": "xsrf-token" },
        });
        expect(refreshCallback).toHaveBeenCalledWith(refreshedResponse);
        expect(axiosInstance.get).toHaveBeenNthCalledWith(
            3,
            "/devices",
            expect.objectContaining({
                headers: { Authorization: "Bearer new-token" },
            }),
        );
    });

    it("shares one in-flight refresh request", async () => {
        let resolveRefresh: (response: AxiosResponse) => void = (_response: AxiosResponse) => {
            throw new Error("Refresh resolver was not initialized");
        };
        const refreshResponse = new Promise<AxiosResponse>((resolve) => {
            resolveRefresh = resolve;
        });
        axiosInstance.get.mockReturnValue(refreshResponse);
        const client = new AuthClientRequest("/refresh", vi.fn());

        const firstRefresh = client.refresh();
        const secondRefresh = client.refresh();
        resolveRefresh({
            data: { accessToken: "new-token" },
        } as AxiosResponse);

        await expect(
            Promise.all([firstRefresh, secondRefresh]),
        ).resolves.toEqual([
            ["new-token", null],
            ["new-token", null],
        ]);
        expect(axiosInstance.get).toHaveBeenCalledTimes(1);
    });

    it("maps a rejected refresh token to the invalid-token error", async () => {
        axiosInstance.get.mockRejectedValue(axiosError(401));
        const client = new AuthClientRequest("/refresh", vi.fn());

        await expect(client.refresh()).resolves.toEqual([
            null,
            AuthClientRequest.ErrInvalidRefreshToken,
        ]);
    });

    it("does not request a refresh without an XSRF token", async () => {
        getCookie.mockReturnValue("");
        const client = new AuthClientRequest("/refresh", vi.fn());

        await expect(client.refresh()).resolves.toEqual([
            null,
            AuthClientRequest.ErrUnauthorized,
        ]);
        expect(getCookie).toHaveBeenCalledWith(XSRF_TOKEN_COOKIE);
        expect(axiosInstance.get).not.toHaveBeenCalled();
    });
});
