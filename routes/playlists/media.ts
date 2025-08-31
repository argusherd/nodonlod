import { Router } from "express";
import { PlaylistRequest } from ".";
import Medium from "../../database/models/medium";

interface MediumRequest extends PlaylistRequest {
  medium: Medium;
}

const router = Router();

router.param("medium", async (req: MediumRequest, res, next) => {
  const medium = await Medium.findByPk(req.params.medium);

  if (medium) {
    req.medium = medium;
    next();
  } else {
    res.sendStatus(404);
  }
});

router.get("/add", async (req: PlaylistRequest, res) => {
  const { rows: media, count } = await Medium.query({ ...req, ...req.query });

  const template = "_list" in req.query ? "media/add/_list" : "media/add";

  res.set("HX-Trigger", "open-modal").render(template, {
    basePath: `/playlists/${req.playlist.id}`,
    media,
    count,
  });
});

router.post("/:medium", async (req: MediumRequest, res) => {
  await req.playlist.$add("medium", req.medium);
  await req.playlist.reorderPlaylistables();

  res
    .set("HX-Trigger", ["close-modal", "refresh-playlistables"])
    .sendStatus(205);
});

export default router;
