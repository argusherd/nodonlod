import { Router } from "express";
import { body, validationResult } from "express-validator";
import { PlaylistRequest } from ".";
import Chapter from "../../database/models/chapter";
import Medium from "../../database/models/medium";
import PlaylistItem from "../../database/models/playlist-item";
import { play } from "../../src/currently-playing";
import { __ } from "../middlewares/i18n";

interface PlaylistItemRequest extends PlaylistRequest {
  playlistItem: PlaylistItem;
}

const router = Router();

router.param("playlistItem", async (req: PlaylistItemRequest, res, next) => {
  const playlistItem = await PlaylistItem.findByPk(req.params.playlistItem);

  if (playlistItem) {
    req.playlistItem = playlistItem;
    next();
  } else {
    res.sendStatus(404);
  }
});

router.get("/", async (req: PlaylistRequest, res) => {
  const template =
    "_list" in req.query
      ? "playlists/playlist-items/_list"
      : "playlists/playlist-items";

  res.render(template, {
    playlist: req.playlist,
    items: await req.playlist.$get("playlistItems", {
      include: [Medium, Chapter],
      order: [["order", "ASC"]],
    }),
  });
});

router.put(
  "/:playlistItem",
  body("order").isNumeric().toInt(),
  async (req: PlaylistItemRequest, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.sendStatus(422);
      return;
    }

    let order = req.body.order;
    order += Number(order > req.playlistItem.order);

    await req.playlistItem.update({ order });
    await req.playlist.reorderPlaylistItems();

    res.set("HX-Trigger", "refresh-playlist-items").sendStatus(205);
  },
);

router.delete(
  "/:playlistItem/confirm",
  async (req: PlaylistItemRequest, res) => {
    res.set("HX-Trigger", "open-modal").render("_delete", {
      message: __("Are you sure you want to delete this item?"),
      route: `/playlists/${req.playlist.id}/playlist-items/${req.playlistItem.id}`,
    });
  },
);

router.delete("/:playlistItem", async (req: PlaylistItemRequest, res) => {
  await req.playlistItem.destroy();
  await req.playlist.reorderPlaylistItems();

  res
    .set("HX-Trigger", ["close-modal", "refresh-playlist-items"])
    .sendStatus(205);
});

router.get("/:playlistItem/play", async (req: PlaylistItemRequest, res) => {
  await play(req.playlistItem);

  res.set("HX-Trigger", "show-playing").sendStatus(202);
});

export default router;
