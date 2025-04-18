import { Router } from "express";
import { LabelRequest } from ".";

const router = Router();

router.get("/", async (req: LabelRequest, res) => {
  const template =
    "_list" in req.query ? "labels/playlists/_list" : "labels/playlists/index";

  res.render(template, {
    label: req.label,
    playlists: await req.label.$get("playlists"),
  });
});

export default router;
