import type { Request, Response, NextFunction } from "express"
import { AddDeviceService } from "../services"
import { validationResult } from "express-validator";
export async function AddDeviceController(req: Request, res: Response, next: NextFunction) { // this is a function to be called by the iot device for onboarding
    // get pairing code from request body
    // find pairing code in cache
    // add device to database (check all capabilities)
    // create permanent jwt token
    // return token device

    try {
        // needs no authentication since this is onboarding
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { code, deviceInfo } = req.body
        const [deviceToken, err] = await AddDeviceService(code, deviceInfo)
        if (err) {
            return res.status(400).json({ error: err.message })
        }
        res.status(201).json({ token: deviceToken }).end()
    } catch (error) {
        next(new Error("Error in add device controller", { cause: error }))
    }
}