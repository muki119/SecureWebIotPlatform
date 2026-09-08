import type { Server } from "node:http";
import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { CreateHealthChecks } from "./health_checks";

const servers: Server[] = [];

async function createTestServer(
    dependencies: { name: string; isReady: () => boolean }[],
) {
    const app = express();
    app.use(CreateHealthChecks(dependencies));

    const server = app.listen(0);
    servers.push(server);

    await new Promise<void>((resolve) => {
        server.once("listening", resolve);
    });

    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("Test server did not start on a TCP port");
    }

    return `http://127.0.0.1:${address.port}`;
}

async function getHealthResponse(
    baseUrl: string,
    path: "/healthz" | "/readyz",
) {
    return fetch(`${baseUrl}${path}`);
}

afterEach(async () => {
    await Promise.all(
        servers.splice(0).map(
            (server) =>
                new Promise<void>((resolve, reject) => {
                    server.close((error) =>
                        error ? reject(error) : resolve(),
                    );
                }),
        ),
    );
});

describe("CreateHealthChecks", () => {
    it("returns a healthy status from healthz", async () => {
        const baseUrl = await createTestServer([
            { name: "redis", isReady: () => true },
            { name: "postgres", isReady: () => true },
        ]);

        const response = await getHealthResponse(baseUrl, "/healthz");
        const body = (await response.json()) as {
            status: string;
            uptime_ms: number;
            timestamp: number;
        };

        expect(response.status).toBe(200);
        expect(body.status).toBe("OK");
        expect(body.uptime_ms).toBeGreaterThanOrEqual(0);
        expect(body.timestamp).toEqual(expect.any(Number));
    });

    it("reports dependency status from status", async () => {
        const baseUrl = await createTestServer([
            { name: "redis", isReady: () => true },
            { name: "postgres", isReady: () => false },
        ]);

        const response = await fetch(`${baseUrl}/status`);
        const body = (await response.json()) as {
            status: string;
            dependencies: { name: string; ready: string }[];
        };

        expect(response.status).toBe(200);
        expect(body.status).toBe("DOWN");
        expect(body.dependencies).toEqual([
            { name: "redis", ready: "UP" },
            { name: "postgres", ready: "DOWN" },
        ]);
    });

    it("returns 200 from readyz when every dependency is ready", async () => {
        const baseUrl = await createTestServer([
            { name: "redis", isReady: () => true },
        ]);

        const response = await getHealthResponse(baseUrl, "/readyz");
        const body = (await response.json()) as {
            status: string;
            dependencies: { name: string; ready: string }[];
        };

        expect(response.status).toBe(200);
        expect(body).toEqual({
            status: "OK",
            dependencies: [{ name: "redis", ready: "UP" }],
        });
    });

    it("returns 503 from readyz when a dependency is unavailable", async () => {
        const baseUrl = await createTestServer([
            { name: "redis", isReady: () => false },
        ]);

        const response = await getHealthResponse(baseUrl, "/readyz");
        const body = (await response.json()) as {
            status: string;
            dependencies: { name: string; ready: string }[];
        };

        expect(response.status).toBe(503);
        expect(body).toEqual({
            status: "Not Ready",
            dependencies: [{ name: "redis", ready: "DOWN" }],
        });
    });

    it("treats an empty dependency list as ready", async () => {
        const baseUrl = await createTestServer([]);

        const healthResponse = await getHealthResponse(baseUrl, "/healthz");
        const readyResponse = await getHealthResponse(baseUrl, "/readyz");

        expect(healthResponse.status).toBe(200);
        expect(readyResponse.status).toBe(200);
    });
});
