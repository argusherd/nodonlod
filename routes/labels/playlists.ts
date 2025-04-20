import { Router } from "express";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import { LabelRequest } from ".";
import Playlist from "../../database/models/playlist";
import { __ } from "../middlewares/i18n";

interface PlaylistRequest extends LabelRequest {
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

router.get("/", async (req: LabelRequest, res) => {
  const template =
    "_list" in req.query ? "labels/playlists/_list" : "labels/playlists/index";

  res.render(template, {
    label: req.label,
    playlists: await req.label.$get("playlists", { order: [["title", "ASC"]] }),
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

router.get("/add", async (req: LabelRequest, res) => {
  const { rows: playlists, count } = await Playlist.findAndCountAll({
    limit: req.perPage,
    offset: req.offset,
    order: [["title", "ASC"]],
    where: {
      ...(req.query.title && {
        title: { [Op.substring]: req.query.title as string },
      }),
    },
  });

  const template =
    "_list" in req.query ? "playlists/add/_list" : "playlists/add/index";

  res.set("HX-Trigger", "open-modal").render(template, {
    basePath: `/labels/${req.label.id}`,
    playlists,
    count,
  });
});

router.post("/:playlist", async (req: PlaylistRequest, res) => {
  await req.label.$add("playlist", req.playlist);

  res.set("HX-Trigger", ["close-modal", "refresh-playlists"]).sendStatus(205);
});

export default router;
