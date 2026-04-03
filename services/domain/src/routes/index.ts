import DomainRouter from "./domain_routes";
import ProfileRouter from "./profile_routes"
import { ValidSessionMiddleware } from "../middleware";
import express from 'express';



const Domain_ProfileRouter = express.Router();

Domain_ProfileRouter.use(ValidSessionMiddleware);
Domain_ProfileRouter.use("/domain", DomainRouter);
Domain_ProfileRouter.use("/profile", ProfileRouter);

export default Domain_ProfileRouter;
