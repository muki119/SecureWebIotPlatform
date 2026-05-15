import type { Request, Response, NextFunction } from "express";
import { GetDomainTransactionsService } from "../services";
export async function GetDomainTransactionsController(req: Request, res: Response, next: NextFunction) {
    try {
        const { domainId } = req.params
        let { from, to } = req.query
        const userId = req.user?.sub

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" })
        }
        if (!domainId) {
            return res.status(400).json({ error: "Domain ID is required" })
        }

        const fromDate = from ? new Date(from as string) : new Date()
        const toDate = to ? new Date(to as string) : undefined
        const [transactions, err] = await GetDomainTransactionsService(userId, domainId as string, fromDate, toDate);
        if (err) {
            return res.status(400).json({ error: err.message })
        }
        res.json(transactions).end();
    } catch (error) {
        next(new Error("Failed to get domain transactions", { cause: error }))
    }

}