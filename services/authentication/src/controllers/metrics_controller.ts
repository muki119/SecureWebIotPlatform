import type { Request, Response } from "express";
import { register } from "../config/metrics";

export default async function MetricsController(_req: Request, res: Response) {
	res.set("Content-Type", register.contentType);
	res.end(await register.metrics());
}
