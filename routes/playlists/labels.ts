import { Router } from "express";
import { PlaylistRequest } from ".";
import Label from "../../database/models/label";
import { HasPageRequest } from "../middlewares/pagination";

interface LabelRequest extends HasPageRequest {
  label: Label;
}

const router = Router();

router.param("label", async (req: LabelRequest, res, next) => {
  const label = await Label.findByPk(req.params.label);

  if (label) {
    req.label = label;
    next();
  } else {
    res.sendStatus(404);
  }
});

router.get("/", async (req: PlaylistRequest, res) => {
  const labels = await req.playlist.$get("labels", {
    order: ["category", "text"],
  });

  const template =
    "_list" in req.query ? "labels/_list" : "playlists/labels/index";

  res.render(template, {
    playlist: req.playlist,
    labels,
    basePath: `/playlists/${req.playlist.id}`,
  });
});

export default router;
