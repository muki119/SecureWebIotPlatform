// health checks
// /healthz - liveness check for the service - will check for dependencies are good
// /readyz - readiness check for the service
// 503 for service not ready or unhealthy to signify service isnt available

import express from "express";

type HealthCheckDependency = {
	name: string;
	isReady: () => boolean | Promise<boolean>;
};

export function CreateHealthChecks(dependencies: HealthCheckDependency[]) {
	const router = express.Router();
	const timeStarted = Date.now();

	const dependenciesReady = async () => {
		return Promise.all(
			dependencies.map(async (dep) => ({
				name: dep.name,
				ready: await Promise.race([
Promise.resolve().then(dep.isReady).catch(() => false),
					new Promise((resolve) =>
						setTimeout(() => resolve(false), 5000),
					),
				]),
			})),
		);
	};

	router.get("/status", async (_req, res) => {
		const uptime_ms = Date.now() - timeStarted;
		const deps = await dependenciesReady();
		const serviceStatus = deps.every((dep) => dep.ready) ? "UP" : "DOWN";

		const dependenciesStatus = deps.map((dep) => ({
			name: dep.name,
			ready: dep.ready ? "UP" : "DOWN",
		}));

		const status = {
			status: serviceStatus,
			uptime_ms,
			timestamp: Date.now(),
			dependencies: dependenciesStatus,
		};
		res.status(200).json(status);
	});

	router.get("/healthz", (_req, res) => {
		const uptime_ms = Date.now() - timeStarted;
		const healthStatus = {
			status: "OK",
			uptime_ms,
			timestamp: Date.now(),
		};
		res.status(200).json(healthStatus);
	});

	router.get("/readyz", async (_req, res) => {
		const dependenciesArr = await dependenciesReady();
		const allDependenciesReady = dependenciesArr.every((dep) => dep.ready);
		const dependenciesStatus = dependenciesArr.map((dep) => ({
			name: dep.name,
			ready: dep.ready ? "UP" : "DOWN",
		}));
		if (allDependenciesReady) {
			res.status(200).json({
				status: "OK",
				dependencies: dependenciesStatus,
			});
		} else {
			res.status(503).json({
				status: "Not Ready",
				dependencies: dependenciesStatus,
			});
		}
	});

	return router;
}
