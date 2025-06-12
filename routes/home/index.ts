import { Router } from "express";
import Label from "../../database/models/label";
import Medium from "../../database/models/medium";
import Performer from "../../database/models/performer";
import Playlist from "../../database/models/playlist";

const router = Router();

router.get("/", async (_req, res) => {
  res.render("home", {
    mediaCount: await Medium.count(),
    playlistCount: await Playlist.count(),
    performerCount: await Performer.count(),
    labelCount: await Label.count(),
  });
});

export default router;
