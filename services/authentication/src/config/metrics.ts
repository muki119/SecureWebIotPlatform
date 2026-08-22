// this is where metrics stuff will be found
// for obsevability
// mainly prometheus metrics and opentelemetry traces and logs

// were going to have ping , current system status , might also try to track requests and faliures and response times for the endpoints
import client from "prom-client";

export const register = new client.Registry();

register.setDefaultLabels({
	app: "authentication_service",
});

export const requestDurationHistogram = new client.Histogram({
	name: "request_duration_seconds",
	help: "Duration of requests in seconds",
	labelNames: ["method", "route", "status_code"],
	buckets: [0.1, 0.5, 1, 2.5, 5, 10],
	registers: [register],
});

client.collectDefaultMetrics({ register });
