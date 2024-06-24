import { Request, Router } from "express";
import Chapter from "../database/models/chapter";
import Medium from "../database/models/medium";
import PlayQueue from "../database/models/play-queue";
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
      include: [Medium, Chapter],
      order: [["order", "ASC"]],
    }),
  });
});

router.post("/:playlist/queue", async (req: PlaylistRequest, res) => {
  let order = Number(await PlayQueue.max("order")) + 1;

  const playlistItems = await PlaylistItem.findAll({
    where: { playlistId: req.playlist.id },
  });

  for (const item of playlistItems) {
    await PlayQueue.create({
      mediumId: item.mediumId,
      chapterId: item.chapterId,
      order: order++,
    });
  }

  res.set("HX-Trigger", "play-queue").sendStatus(201);
});

router.delete("/:playlist", async (req: PlaylistRequest, res) => {
  await req.playlist.destroy();

  res.sendStatus(204);
});

export default router;
