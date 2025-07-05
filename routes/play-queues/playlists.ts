import { Router } from "express";
import { body, validationResult } from "express-validator";
import PlayQueue from "../../database/models/play-queue";
import Playlist from "../../database/models/playlist";
import Playlistable, {
  PlaylistableCreationAttributes,
} from "../../database/models/playlistable";
import { __ } from "../middlewares/i18n";

const router = Router();

router.get("/create", async (_req, res) => {
  res
    .set("HX-Trigger", "open-modal")
    .render("playlists/create", { basePath: "/play-queues" });
});

router.post(
  "/",
  body("title")
    .notEmpty({ ignore_whitespace: true })
    .withMessage(__("The title is missing.")),
  async (req, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      const playlist = await Playlist.create({
        title: req.body.title,
        thumbnail: req.body.thumbnail,
        description: req.body.description,
      });

      const playQueues = await PlayQueue.findAll({ order: ["order"] });
      const playlistables: PlaylistableCreationAttributes[] = [];
      let order = 1;

      for (const playQueue of playQueues)
        playlistables.push({
          playlistId: playlist.id,
          mediumId: playQueue.mediumId,
          chapterId: playQueue.chapterId,
          order: order++,
        });

      await Playlistable.bulkCreate(playlistables);

      res.set("HX-Location", `/playlists/${playlist.id}`).sendStatus(201);
    } else {
      res.status(422).render("playlists/create", { errors: errors.mapped() });
    }
  },
);

export default router;
