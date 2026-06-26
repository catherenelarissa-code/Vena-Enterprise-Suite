import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import suppliersRouter from "./suppliers";
import purchasesRouter from "./purchases";
import financialRouter from "./financial";
import projectsRouter from "./projects";
import materialsRouter from "./materials";
import priceMonitorRouter from "./price-monitor";
import automationRouter from "./automation";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/dashboard", dashboardRouter);
router.use("/suppliers", suppliersRouter);
router.use("/purchases", purchasesRouter);
router.use("/financial", financialRouter);
router.use("/projects", projectsRouter);
router.use("/materials", materialsRouter);
router.use("/price-monitor", priceMonitorRouter);
router.use("/automation", automationRouter);

export default router;
