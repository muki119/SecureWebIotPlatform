import type { Request, Response, NextFunction } from "express"
import { GetDeviceTelemetryService } from "../services"
import { Intervals } from "../types"
import { validationResult } from "express-validator"

export async function GetDeviceTelemetryController(req: Request, res: Response, next: NextFunction) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        const userId = req.user?.sub
        const { deviceId } = req.params
        const { capability, interval, from } = req.query
        if (!capability) {
            return res.status(400).json({ error: "Capability is required" })
        }
        const [telemetry, err] = await GetDeviceTelemetryService(userId as string, deviceId as string, capability as string, interval as Intervals, new Date(from as string))
        if (err) {
            return res.status(400).json({ error: err.message })
        }
        res.status(200).json({ telemetry }).end()
    } catch (error) {
        next(new Error("Failed to get device telemetry", { cause: error }))
    }
}   