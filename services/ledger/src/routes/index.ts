import { GetDomainTransactionsController } from "../controllers"
import { Router } from "express"

export const LedgerRouter = Router()
LedgerRouter.get("/transactions/:domain", GetDomainTransactionsController)
