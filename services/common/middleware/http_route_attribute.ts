import { context } from "@opentelemetry/api";
import { getRPCMetadata, RPCType } from "@opentelemetry/core";
import type { NextFunction, Request, Response } from "express";

/**
 * Express 5 routes through the standalone `router` package, and neither
 * `@opentelemetry/instrumentation-router` nor `-express` writes the matched
 * route into the RPC metadata that `@opentelemetry/instrumentation-http` reads.
 * Without this, `http.server.request.duration` carries no `http.route`
 * attribute, so request latency can't be broken down per route.
 *
 * Mount this before the routers. Once a route matches, `req.route` is populated;
 * on the response `finish` event (which fires before the HTTP instrumentation
 * records its metric on `close`) we copy the route template onto the live RPC
 * metadata object.
 */
export default function HttpRouteAttributeMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	res.once("finish", () => {
		const rpc = getRPCMetadata(context.active());
		const path = req.route?.path;
		if (rpc?.type === RPCType.HTTP && typeof path === "string") {
			rpc.route = `${req.baseUrl}${path}`;
		}
	});
	next();
}
