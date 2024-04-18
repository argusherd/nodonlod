import { Router } from "express";
import Playlist from "../database/models/playlist";

const router = Router();

router.get("/", async (_req, res) => {
  res.render("playlists/index", {
    playlists: await Playlist.findAll(),
  });
});

export default router;
