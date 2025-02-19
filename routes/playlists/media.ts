import { Router } from "express";
import { PlaylistRequest } from ".";
import Chapter from "../../database/models/chapter";
import Medium from "../../database/models/medium";

const router = Router();

router.get("/", async (req: PlaylistRequest, res) => {
  res.render("playlists/media", {
    playlist: req.playlist,
    items: await req.playlist.$get("playlistItems", {
      include: [Medium, Chapter],
      order: [["order", "ASC"]],
    }),
  });
});

export default router;
