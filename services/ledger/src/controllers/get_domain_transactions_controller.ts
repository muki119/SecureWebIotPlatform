import type { Request, Response, NextFunction } from "express";
import { GetDomainTransactionsService } from "../services";
export async function GetDomainTransactionsController(req: Request, res: Response, next: NextFunction) {
    try {
        const { domainId } = req.params
        const { from, to } = req.query
        const userId = req.user?.sub

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" })
        }
        if (!domainId) {
            return res.status(400).json({ error: "Domain ID is required" })
        }
        const [transactions, err] = await GetDomainTransactionsService(userId, domainId as string, new Date(from as string), new Date(to as string));
        if (err) {
            return res.status(400).json({ error: err.message })
        }
        res.json({ transactions });
    } catch (error) {
        next(new Error("Failed to get domain transactions", { cause: error }))
    }

}