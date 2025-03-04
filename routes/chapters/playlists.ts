import { Router } from "express";
import { Op } from "sequelize";
import { ChapterRequest } from ".";
import Playlist from "../../database/models/playlist";
import Playlistable from "../../database/models/playlistable";
import { HasPageRequest } from "../middlewares/pagination";

interface PlaylistRequest extends HasPageRequest {
  playlist: Playlist;
}

const router = Router();

router.param("playlist", async (req: PlaylistRequest, res, next) => {
  const playlist = await Playlist.findByPk(req.params.playlist);

  if (playlist) {
    req.playlist = playlist;
    next();
  } else {
    res.sendStatus(404);
  }
});

router.get("/add", async (req: ChapterRequest, res) => {
  const { rows: playlists, count } = await Playlist.findAndCountAll({
    limit: req.perPage,
    offset: req.offset,
    order: [["title", "ASC"]],
    where: {
      ...(req.query.title && {
        title: { [Op.substring]: req.query.title as string },
      }),
    },
  });

  const template =
    "_list" in req.query ? "playlists/add/_list" : "playlists/add/index";

  res.set("HX-Trigger", "open-modal").render(template, {
    basePath: `/chapters/${req.chapter.id}/playlists`,
    playlists,
    count,
  });
});

router.post(
  "/:playlist",
  async (req: ChapterRequest & PlaylistRequest, res) => {
    const alreadyInPlaylist = await req.chapter.$has("playlist", req.playlist);

    if (!alreadyInPlaylist) {
      await Playlistable.create({
        mediumId: req.chapter.mediumId,
        chapterId: req.chapter.id,
        playlistId: req.playlist.id,
      });
      await req.playlist.reorderPlaylistables();
    }

    res
      .set("HX-Trigger", "close-modal")
      .set("HX-Location", `/playlists/${req.playlist.id}/playlistables`)
      .sendStatus(205);
  },
);

export default router;
