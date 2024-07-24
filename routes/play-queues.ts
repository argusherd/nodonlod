import { Request, Router } from "express";
import Chapter from "../database/models/chapter";
import Medium from "../database/models/medium";
import PlayQueue from "../database/models/play-queue";

interface HasPlayQueue extends Request {
  playQueue: PlayQueue;
}

const router = Router();

router.param("playQueue", async (req: HasPlayQueue, res, next) => {
  const playQueue = await PlayQueue.findByPk(req.params.playQueue);

  if (playQueue) {
    req.playQueue = playQueue;
    next();
  } else {
    res.sendStatus(404);
  }
});

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

router.delete("/:playQueue", async (req: HasPlayQueue, res) => {
  await req.playQueue.destroy();

  res.sendStatus(205);
});

export default router;
