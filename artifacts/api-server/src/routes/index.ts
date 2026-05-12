import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatbotsRouter from "./chatbots";
import documentsRouter from "./documents";
import conversationsRouter from "./conversations";
import analyticsRouter from "./analytics";
import widgetRouter from "./widget";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatbotsRouter);
router.use(documentsRouter);
router.use(conversationsRouter);
router.use(analyticsRouter);
router.use(widgetRouter);

export default router;
