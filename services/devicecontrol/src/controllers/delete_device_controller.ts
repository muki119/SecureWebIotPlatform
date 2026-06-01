import type { Request, Response, NextFunction } from "express"
import { DeleteDeviceService } from "../services"
import { validationResult } from "express-validator"

export async function DeleteDeviceController(req: Request, res: Response, next: NextFunction) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        const userId = req.user?.sub
        const { deviceId } = req.params
        const [deletedDevice, err] = await DeleteDeviceService(userId as string, deviceId as string)
        if (err) {
            return res.status(400).json({ error: err.message })
        }
        res.status(200).json(deletedDevice).end()
    } catch (error) {
        next(new Error("Failed to delete device", { cause: error }))
    }
}