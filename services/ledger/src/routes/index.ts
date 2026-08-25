import { Router } from "express";
import { GetDomainTransactionsController } from "../controllers";
import { ValidSessionMiddleware } from "../middleware";

export const LedgerRouter = Router();
LedgerRouter.use(ValidSessionMiddleware);
LedgerRouter.get("/transactions/:domainId", GetDomainTransactionsController);
