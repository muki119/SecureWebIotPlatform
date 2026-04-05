import type { Request, Response, NextFunction } from "express"
import { DeleteDeviceService } from "../services"
export async function DeleteDeviceController(req: Request, res: Response, next: NextFunction) {
    /// get user id
    // get device id from param

    try {
        const userId = req.user?.sub
        const { deviceId } = req.params
        if (!deviceId) {
            return res.status(400).json({ error: "Device ID is required" })
        }
        const [deletedDevice, err] = await DeleteDeviceService(userId as string, deviceId as string)
        if (err) {
            return res.status(400).json({ error: err.message })
        }
        res.status(200).json(deletedDevice).end()
    } catch (error) {
        next(new Error("Failed to delete device", { cause: error }))
    }
}