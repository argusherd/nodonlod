import { Request, Router } from "express";
import Playlist from "../database/models/playlist";

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
    playables: await req.playlist.$get("playables"),
  });
});

export default router;
