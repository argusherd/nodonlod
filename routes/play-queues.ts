import { Request, Router } from "express";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import Chapter from "../database/models/chapter";
import Medium from "../database/models/medium";
import PlayQueue from "../database/models/play-queue";
import { i18n } from "./middlewares/i18n";

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

router.delete("/confirm", (_req, res) => {
  res.set("HX-Trigger", "open-modal").render("_delete", {
    message: i18n.__(
      "Are you sure you want to delete all items in the play queue?",
    ),
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

export default router;
