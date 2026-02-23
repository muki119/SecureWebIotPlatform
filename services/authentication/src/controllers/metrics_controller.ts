import { register } from "../config/metrics";
import type { Request, Response } from 'express';


export default async function metricsController(req: Request, res: Response) {
    console.log("Hit ")
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
}