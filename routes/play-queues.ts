import { Router } from "express";
import Chapter from "../database/models/chapter";
import PlayQueue from "../database/models/play-queue";
import Playable from "../database/models/playable";

const router = Router();

router.get("/", async (_req, res) => {
  res.render("play-queues/index", {
    items: await PlayQueue.findAll({
      include: [Playable, Chapter],
      order: [["order", "ASC"]],
    }),
  });
});

export default router;
