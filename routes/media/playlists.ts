import { Router } from "express";
import { body, validationResult } from "express-validator";
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

  const playlists = await Playlist.findAll({
    include: {
      model: Playlistable,
      required: true,
      where: { mediumId: req.medium.id },
    },
  });

  res.render(template, { medium: req.medium, playlists });
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
      await playlist.reorderPlaylistables();

      res
        .set("HX-Trigger", ["close-modal", "refresh-playlists"])
        .sendStatus(205);
    } else {
      res.status(422).render("playlists/create", {
        basePath: `/media/${req.medium.id}`,
        errors: errors.mapped(),
      });
    }
  },
);

router.get("/create", (req: MediumRequest, res) => {
  res
    .set("HX-Trigger", "open-modal")
    .render("playlists/create", { basePath: `/media/${req.medium.id}` });
});

router.get("/add", async (req: MediumRequest & HasPageRequest, res) => {
  const { rows: playlists, count } = await Playlist.query({
    ...req,
    ...req.query,
  });

  const template =
    "_list" in req.query ? "playlists/add/_list" : "playlists/add/index";

  res.set("HX-Trigger", "open-modal").render(template, {
    basePath: `/media/${req.medium.id}`,
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
  "/:playlist/confirm",
  (req: MediumRequest & PlaylistRequest, res) => {
    res.set("HX-Trigger", "open-modal").render("_delete", {
      message: __("Are you sure you want to remove this playlist?"),
      route: `/media/${req.medium.id}/playlists/${req.playlist.id}`,
    });
  },
);

router.delete(
  "/:playlist",
  async (req: MediumRequest & PlaylistRequest, res) => {
    await req.medium.$remove("playlist", req.playlist);

    res.set("HX-Trigger", "refresh-playlists").sendStatus(205);
  },
);

export default router;
