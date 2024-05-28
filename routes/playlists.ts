import { Request, Router } from "express";
import Chapter from "../database/models/chapter";
import Playable from "../database/models/playable";
import Playlist from "../database/models/playlist";
import PlaylistItem from "../database/models/playlist-item";

interface PlaylistRequest extends Request {
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

router.get("/", async (_req, res) => {
  res.render("playlists/index", {
    playlists: await Playlist.findAll(),
  });
});

router.get("/:playlist", async (req: PlaylistRequest, res) => {
  res.render("playlists/show.pug", {
    playlist: req.playlist,
    items: await PlaylistItem.findAll({
      where: { playlistId: req.playlist.id },
      include: [Playable, Chapter],
      order: [["order", "ASC"]],
    }),
  });
});

export default router;
