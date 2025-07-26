import { Request, Router } from "express";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import Chapter from "../../database/models/chapter";
import Medium from "../../database/models/medium";
import PlayQueue from "../../database/models/play-queue";
import mediaPlayer from "../../src/media-player";
import { __ } from "../middlewares/i18n";
import playlistRouter from "./playlists";

interface HasPlayQueue extends Request {
  playQueue: PlayQueue;
}

const router = Router();

let current = 0;

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
    current,
  });
});

router.delete("/confirm", (_req, res) => {
  res.set("HX-Trigger", "open-modal").render("_delete", {
    message: __("Are you sure you want to delete all items in the play queue?"),
    route: "/play-queues",
  });
});

router.delete("/", async (_req, res) => {
  await PlayQueue.truncate();

  res.set("HX-Trigger", "refresh-play-queues").sendStatus(204);
});

router.delete("/:playQueue", async (req: HasPlayQueue, res) => {
  await req.playQueue.destroy();

  await PlayQueue.decrement("order", {
    by: 1,
    where: { order: { [Op.gt]: req.playQueue.order } },
  });

  res.sendStatus(205);
});

router.put(
  "/:playQueue",
  body("order").isNumeric(),
  async (req: HasPlayQueue, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.sendStatus(422);
      return;
    }

    const order = Number(req.body.order);
    const between = [order, req.playQueue.order].sort();

    await PlayQueue.increment("order", {
      by: order > req.playQueue.order ? -1 : 1,
      where: { order: { [Op.between]: between as [number, number] } },
    });

    await req.playQueue.update({ order });

    res.sendStatus(205);
  },
);

router.get("/:playQueue/play", async (req: HasPlayQueue, res) => {
  const medium = (await req.playQueue.$get("medium")) as Medium;
  const chapter = await req.playQueue.$get("chapter");

  mediaPlayer.play(medium.url, chapter?.startTime, chapter?.endTime);
  current = req.playQueue.id;

  const nextQueue = await PlayQueue.findOne({
    where: { order: { [Op.gt]: req.playQueue.order } },
    order: ["order"],
  });
  const firstQueue = await PlayQueue.findOne({ order: ["order"] });
  const count = await PlayQueue.count();
  const randomOffset = Math.floor(Math.random() * count);
  const randomQueue = await PlayQueue.findOne({
    offset: randomOffset,
    order: ["order"],
  });

  res
    .set(
      "HX-Trigger",
      JSON.stringify({ "currently-playing": req.playQueue.id }),
    )
    .render("player/show", {
      medium,
      chapter,
      from: chapter ? `/media/${medium.id}/chapters` : `/media/${medium.id}`,
      first: `/play-queues/${firstQueue?.id}/play`,
      next: nextQueue ? `/play-queues/${nextQueue?.id}/play` : "",
      random: `/play-queues/${randomQueue?.id}/play`,
    });
});

router.use("/playlists", playlistRouter);

export default router;
