import { register } from "../config/metrics";
import type { Request, Response } from 'express';


export default async function MetricsController(req: Request, res: Response) {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
}