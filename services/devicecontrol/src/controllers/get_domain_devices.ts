import type { Request, Response, NextFunction } from "express"
import { GetDomainDevicesService } from "../services"

export async function GetDomainDevicesController(req: Request, res: Response, next: NextFunction) {
    // get userid , domainid / date , and interval
    try {
        const userId = req.user?.sub
        const { domainId } = req.params
        if (!domainId) {
            return res.status(400).json({ error: "Domain ID is required" })
        }
        const [devices, err] = await GetDomainDevicesService(userId as string, domainId as string)
        if (err) {
            return res.status(400).json({ error: err.message })
        }
        res.status(200).json(devices).end()
    } catch (error) {
        next(new Error("Failed to get devices in domain", { cause: error }))
    }
}