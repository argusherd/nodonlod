import { scheduleJob } from "node-schedule";
import processOnePendingExtraction from "./jobs/process-one-pending-extraction";

scheduleJob(
  processOnePendingExtraction.name,
  { rule: "*/5 * * * * *", start: new Date(Date.now() + 5000) },
  processOnePendingExtraction,
);
