import { Router } from "express";
import { body, validationResult } from "express-validator";
import Chapter from "../database/models/chapter";
import Medium from "../database/models/medium";
import PlayQueue, {
  PlayQueueCreationAttributes,
} from "../database/models/play-queue";
import Playlist from "../database/models/playlist";
import PlaylistItem from "../database/models/playlist-item";
import { play } from "../src/currently-playing";
import { __ } from "./middlewares/i18n";
import { HasPageRequest } from "./middlewares/pagination";

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

router.get("/", async (req: HasPageRequest, res) => {
  const { rows: playlists, count } = await Playlist.findAndCountAll({
    limit: req.perPage,
    offset: req.offset,
    order: [["createdAt", "DESC"]],
  });

  res.render("playlists/index", {
    playlists,
    count,
  });
});

router.get("/create", async (_req, res) => {
  res.set("HX-Trigger", "open-modal").render("playlists/create");
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
      res.set("HX-Location", `/playlists/${playlist.id}`).sendStatus(201);
    } else {
      res.status(422).render("playlists/create", { errors: errors.mapped() });
    }
  },
);

router.get("/:playlist", async (req: PlaylistRequest, res) => {
  res.render("playlists/show.pug", {
    playlist: req.playlist,
    items: await PlaylistItem.findAll({
      where: { playlistId: req.playlist.id },
      include: [Medium, Chapter],
      order: [["order", "ASC"]],
    }),
  });
});

router.put(
  "/:playlist",
  body("title")
    .notEmpty({ ignore_whitespace: true })
    .withMessage("The title is missing."),
  async (req: PlaylistRequest, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      await req.playlist.update({
        title: req.body.title,
        thumbnail: req.body.thumbnail,
        description: req.body.description,
      });

      res
        .set("HX-Trigger", "playlist-saved")
        .render("playlists/_info", { playlist: req.playlist });
    } else {
      res
        .status(422)
        .set("HX-Trigger", "playlist-failed")
        .render("playlists/_info", {
          playlist: req.playlist,
          errors: errors.mapped(),
        });
    }
  },
);

router.get("/:playlist/play", async (req: PlaylistRequest, res) => {
  const firstItem = await PlaylistItem.findOne({
    order: [["order", "ASC"]],
    where: { playlistId: req.playlist.id },
  });

  await play(firstItem);

  res.sendStatus(202);
});

router.post("/:playlist/queue", async (req: PlaylistRequest, res) => {
  const playlistItems = await PlaylistItem.findAll({
    order: [["order", "ASC"]],
    where: { playlistId: req.playlist.id },
  });

  await queue(playlistItems);

  res.set("HX-Trigger", "refresh-play-queues").sendStatus(201);
});

router.delete("/:playlist/confirm", (req: PlaylistRequest, res) => {
  res.set("HX-Trigger", "open-modal").render("_delete", {
    message: __("Are you sure you want to delete this playlist?"),
    route: `/playlists/${req.playlist.id}`,
  });
});

router.delete("/:playlist", async (req: PlaylistRequest, res) => {
  await req.playlist.destroy();

  res.set("HX-Location", "/playlists").sendStatus(204);
});

async function queue(playlistItems: PlaylistItem[]) {
  const data: PlayQueueCreationAttributes[] = [];
  let order = Number(await PlayQueue.max("order")) + 1;

  for (const playlistItem of playlistItems)
    data.push({
      mediumId: playlistItem.mediumId,
      chapterId: playlistItem.chapterId,
      order: order++,
    });

  await PlayQueue.bulkCreate(data);
}

export default router;
