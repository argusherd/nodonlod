import { Request, Router } from "express";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import PlaylistItem from "../database/models/playlist-item";
import { play } from "../src/currently-playing";

interface HasPlaylistItem extends Request {
  playlistItem: PlaylistItem;
}

const router = Router();

router.param("playlistItem", async (req: HasPlaylistItem, res, next) => {
  const playlistItem = await PlaylistItem.findByPk(req.params.playlistItem);

  if (playlistItem) {
    req.playlistItem = playlistItem;
    next();
  } else {
    res.sendStatus(404);
  }
});

router.put(
  "/:playlistItem",
  body("order").isNumeric(),
  async (req: HasPlaylistItem, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.sendStatus(422);
      return;
    }

    const playlistItem = req.playlistItem;
    const max = await PlaylistItem.count({
      where: { playlistId: playlistItem.playlistId },
    });
    const order = Math.max(1, Math.min(max, Number(req.body.order)));
    const between = [order, playlistItem.order].sort();

    if (order > playlistItem.order) between[0] += 1;
    else between[1] -= 1;

    await PlaylistItem.increment("order", {
      by: order > playlistItem.order ? -1 : 1,
      where: { order: { [Op.between]: between as [number, number] } },
    });

    await req.playlistItem.update({ order });

    res.set("HX-Trigger", "refresh-media").sendStatus(205);
  },
);

router.get("/:playlistItem/play", async (req: HasPlaylistItem, res) => {
  await play(req.playlistItem);

  res.set("HX-Trigger", "show-playing").sendStatus(202);
});

export default router;
