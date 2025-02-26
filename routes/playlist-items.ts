import { Request, Router } from "express";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import PlaylistItem from "../database/models/playlist-item";
import { play } from "../src/currently-playing";
import { __ } from "./middlewares/i18n";

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
  body("order").isNumeric().toInt(),
  async (req: HasPlaylistItem, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.sendStatus(422);
      return;
    }

    const playlist = await req.playlistItem.$get("playlist");
    let order = req.body.order;
    order += Number(order > req.playlistItem.order);

    await req.playlistItem.update({ order });
    await playlist?.reorderPlaylistItems();

    res.set("HX-Trigger", "refresh-playlist-items").sendStatus(205);
  },
);

router.get("/:playlistItem/play", async (req: HasPlaylistItem, res) => {
  await play(req.playlistItem);

  res.set("HX-Trigger", "show-playing").sendStatus(202);
});

router.delete("/:playlistItem/confirm", async (req: HasPlaylistItem, res) => {
  res.set("HX-Trigger", "open-modal").render("_delete", {
    message: __("Are you sure you want to delete this item?"),
    route: `/playlist-items/${req.playlistItem.id}`,
  });
});

router.delete("/:playlistItem", async (req: HasPlaylistItem, res) => {
  await PlaylistItem.decrement("order", {
    by: 1,
    where: {
      playlistId: req.playlistItem.playlistId,
      order: { [Op.gte]: req.playlistItem.order },
    },
  });

  await req.playlistItem.destroy();

  res
    .set("HX-Trigger", ["close-modal", "refresh-playlist-items"])
    .sendStatus(205);
});

export default router;
