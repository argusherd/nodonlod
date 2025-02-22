import { Router } from "express";
import { PlaylistRequest } from ".";
import Chapter from "../../database/models/chapter";
import Medium from "../../database/models/medium";

const router = Router();

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

export default router;
