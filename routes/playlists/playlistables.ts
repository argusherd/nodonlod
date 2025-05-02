import { Router } from "express";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import { PlaylistRequest } from ".";
import Chapter from "../../database/models/chapter";
import Medium from "../../database/models/medium";
import Playlistable from "../../database/models/playlistable";
import mediaPlayer from "../../src/media-player";
import { __ } from "../middlewares/i18n";

interface PlaylistableRequest extends PlaylistRequest {
  playlistable: Playlistable;
}

const router = Router();

router.param("playlistable", async (req: PlaylistableRequest, res, next) => {
  const playlistable = await Playlistable.findByPk(req.params.playlistable);

  if (playlistable) {
    req.playlistable = playlistable;
    next();
  } else {
    res.sendStatus(404);
  }
});

router.get("/", async (req: PlaylistRequest, res) => {
  const template =
    "_list" in req.query
      ? "playlists/playlistables/_list"
      : "playlists/playlistables";

  res.render(template, {
    playlist: req.playlist,
    playlistables: await req.playlist.$get("playlistables", {
      include: [Medium, Chapter],
      order: [["order", "ASC"]],
    }),
  });
});

router.put(
  "/:playlistable",
  body("order").isNumeric().toInt(),
  async (req: PlaylistableRequest, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.sendStatus(422);
      return;
    }

    let order = req.body.order;
    order += Number(order > req.playlistable.order);

    await req.playlistable.update({ order });
    await req.playlist.reorderPlaylistables();

    res.set("HX-Trigger", "refresh-playlistables").sendStatus(205);
  },
);

router.delete(
  "/:playlistable/confirm",
  async (req: PlaylistableRequest, res) => {
    res.set("HX-Trigger", "open-modal").render("_delete", {
      message: __("Are you sure you want to delete this item?"),
      route: `/playlists/${req.playlist.id}/playlistables/${req.playlistable.id}`,
    });
  },
);

router.delete("/:playlistable", async (req: PlaylistableRequest, res) => {
  await req.playlistable.destroy();
  await req.playlist.reorderPlaylistables();

  res
    .set("HX-Trigger", ["close-modal", "refresh-playlistables"])
    .sendStatus(205);
});

router.get("/:playlistable/play", async (req: PlaylistableRequest, res) => {
  const medium = await req.playlistable.$get("medium");
  const chapter = await req.playlistable.$get("chapter");

  mediaPlayer.play(medium?.url || "", chapter?.startTime, chapter?.endTime);

  let nextPlaylistable = await Playlistable.findOne({
    where: {
      playlistId: req.playlist.id,
      order: { [Op.gt]: req.playlistable.order },
    },
    order: ["order"],
  });

  if (!nextPlaylistable)
    nextPlaylistable = await Playlistable.findOne({
      where: { playlistId: req.playlist.id },
      order: ["order"],
    });

  const count = await req.playlist.$count("playlistables");
  const randomOffset = Math.floor(Math.random() * count);
  const randomPlaylistable = await Playlistable.findOne({
    where: { playlistId: req.playlist.id },
    offset: randomOffset,
    order: ["order"],
  });

  res.render("player/show", {
    playlist: req.playlist,
    medium,
    chapter,
    from: `/playlists/${req.playlist.id}/playlistables`,
    next: `/playlists/${req.playlist.id}/playlistables/${nextPlaylistable?.id}/play`,
    random: `/playlists/${req.playlist.id}/playlistables/${randomPlaylistable?.id}/play`,
  });
});

export default router;
