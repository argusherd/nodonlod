import { Request, Router } from "express";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import PlaylistItem from "../database/models/playlist-item";

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

    const order = Number(req.body.order);
    const between = [order, req.playlistItem.order].sort();

    await PlaylistItem.increment("order", {
      by: order > req.playlistItem.order ? -1 : 1,
      where: { order: { [Op.between]: between as [number, number] } },
    });

    await req.playlistItem.update({ order });

    res.sendStatus(205);
  },
);

export default router;
