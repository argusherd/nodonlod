import { Router } from "express";
import Chapter from "../database/models/chapter";
import Medium from "../database/models/medium";
import PlayQueue from "../database/models/play-queue";

const router = Router();

router.get("/", async (_req, res) => {
  res.render("play-queues/index", {
    items: await PlayQueue.findAll({
      include: [Medium, Chapter],
      order: [["order", "ASC"]],
    }),
  });
});

router.delete("/", async (_req, res) => {
  await PlayQueue.truncate();

  res.set("HX-Trigger", "refresh-play-queues").sendStatus(204);
});

export default router;
