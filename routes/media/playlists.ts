import { Router } from "express";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import { MediumRequest } from ".";
import Playlist from "../../database/models/playlist";
import Playlistable from "../../database/models/playlistable";
import { __ } from "../middlewares/i18n";
import { HasPageRequest } from "../middlewares/pagination";

interface PlaylistRequest extends HasPageRequest {
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

router.get("/", async (req: MediumRequest, res) => {
  const template =
    "_list" in req.query ? "media/playlists/_list" : "media/playlists/index";

  res.render(template, {
    medium: req.medium,
    playlists: await req.medium.$get("playlists"),
  });
});

router.post(
  "/",
  body("title")
    .notEmpty({ ignore_whitespace: true })
    .withMessage(__("The title is missing.")),
  async (req: MediumRequest, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      const playlist = await Playlist.create({ title: req.body.title });

      await req.medium.$add("playlist", playlist);

      res
        .set("HX-Trigger", ["close-modal", "refresh-playlists"])
        .sendStatus(205);
    } else {
      res.status(422).render("media/playlists/create", {
        medium: req.medium,
        errors: errors.mapped(),
      });
    }
  },
);

router.get("/create", (req: MediumRequest, res) => {
  res
    .set("HX-Trigger", "open-modal")
    .render("media/playlists/create", { medium: req.medium });
});

router.get("/search", async (req: MediumRequest & HasPageRequest, res) => {
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

  res.render("media/playlists/_search", {
    medium: req.medium,
    playlists,
    count,
  });
});

router.post("/:playlist", async (req: MediumRequest & PlaylistRequest, res) => {
  const alreadyInPlaylist = await req.medium.$has("playlist", req.playlist);

  if (!alreadyInPlaylist) {
    const maxOrder = (await Playlistable.max("order", {
      where: { playlistId: req.playlist.id },
    })) as number;

    await req.medium.$add("playlist", req.playlist, {
      through: { order: maxOrder + 1 },
    });
  }

  res.set("HX-Trigger", ["close-modal", "refresh-playlists"]).sendStatus(205);
});

router.delete(
  "/:playlist",
  async (req: MediumRequest & PlaylistRequest, res) => {
    await req.medium.$remove("playlist", req.playlist);

    res.set("HX-Trigger", "refresh-playlists").sendStatus(205);
  },
);

export default router;
