import { GetDomainTransactionsController } from "../controllers"
import { ValidSessionMiddleware } from "../middleware"
import { Router } from "express"

export const LedgerRouter = Router()
LedgerRouter.use(ValidSessionMiddleware)
LedgerRouter.get("/transactions/:domainId", GetDomainTransactionsController)
