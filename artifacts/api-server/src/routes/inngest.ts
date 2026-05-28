import { Router } from "express";
import { serve } from "inngest/express";
import { inngest } from "../lib/inngest";
import { startCrawlJob, processPageIngestion } from "../jobs/ingestion";

const router = Router();

// Inngest Engine Endpoint
router.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [startCrawlJob, processPageIngestion],
  })
);

export default router;
