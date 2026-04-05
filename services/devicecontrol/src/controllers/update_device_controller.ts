import type { Request, Response, NextFunction } from "express"
import { UpdateDeviceService } from "../services"
export async function UpdateDeviceController(req: Request, res: Response, next: NextFunction) {
    /// get user id
    // get device id from param

    try {
        const userId = req.user?.sub
        const { deviceId } = req.params
        const { changes } = req.body
        if (!deviceId) {
            return res.status(400).json({ error: "Device ID is required" })
        }
        const [updatedDevice, err] = await UpdateDeviceService(userId as string, deviceId as string, changes)
        if (err) {
            return res.status(400).json({ error: err.message })
        }
        res.status(200).json(updatedDevice).end()
    } catch (error) {
        next(new Error("Failed to update device", { cause: error }))
    }
}