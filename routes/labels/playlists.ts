import { Router } from "express";
import { body, validationResult } from "express-validator";
import { LabelRequest } from ".";
import Playlist from "../../database/models/playlist";
import { __ } from "../middlewares/i18n";

const router = Router();

router.get("/", async (req: LabelRequest, res) => {
  const template =
    "_list" in req.query ? "labels/playlists/_list" : "labels/playlists/index";

  res.render(template, {
    label: req.label,
    playlists: await req.label.$get("playlists"),
  });
});

router.post(
  "/",
  body("title")
    .notEmpty({ ignore_whitespace: true })
    .withMessage(__("The title is missing.")),
  async (req: LabelRequest, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      const playlist = await Playlist.create({
        title: req.body.title,
        thumbnail: req.body.thumbnail || null,
        description: req.body.description || null,
      });

      await req.label.$add("playlist", playlist);
      await playlist.reorderPlaylistables();

      res
        .set("HX-Trigger", ["close-modal", "refresh-playlists"])
        .sendStatus(205);
    } else {
      res.status(422).render("playlists/create", {
        basePath: `/labels/${req.label.id}`,
        errors: errors.mapped(),
      });
    }
  },
);

router.get("/create", (req: LabelRequest, res) => {
  res
    .set("HX-Trigger", "open-modal")
    .render("playlists/create", { basePath: `/labels/${req.label.id}` });
});

export default router;
