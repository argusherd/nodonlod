import { Router } from "express";
import { PerformerRequest } from ".";
import Medium from "../../database/models/medium";
import Performer from "../../database/models/performer";
import Playlist from "../../database/models/playlist";

const router = Router();

router.get("/", async (req: PerformerRequest, res) => {
  const playlists = await Playlist.findAll({
    include: {
      model: Medium,
      required: true,
      include: [
        { model: Performer, required: true, where: { id: req.performer.id } },
      ],
    },
    order: [["title", "ASC"]],
  });

  res.render("performers/playlists/index", {
    performer: req.performer,
    playlists,
  });
});

export default router;
