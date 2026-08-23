import express from "express";
import { ValidSessionMiddleware } from "../middleware";
import DomainRouter from "./domain_routes";
import ProfileRouter from "./profile_routes";

const DomainProfileRouter = express.Router();

DomainProfileRouter.use(ValidSessionMiddleware);
DomainProfileRouter.use("/domain", DomainRouter);
DomainProfileRouter.use("/profile", ProfileRouter);

export default DomainProfileRouter;
