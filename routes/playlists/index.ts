import { Router } from "express";
import { body, query, validationResult } from "express-validator";
import { Op } from "sequelize";
import Chapter from "../../database/models/chapter";
import Medium from "../../database/models/medium";
import PlayQueue, {
  PlayQueueCreationAttributes,
} from "../../database/models/play-queue";
import Playlist from "../../database/models/playlist";
import Playlistable from "../../database/models/playlistable";
import mediaPlayer from "../../src/media-player";
import { __ } from "../middlewares/i18n";
import { HasPageRequest } from "../middlewares/pagination";
import labelRouter from "./labels";
import mediumRouter from "./media";
import playlistableRouter from "./playlistables";

export interface PlaylistRequest extends HasPageRequest {
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

router.get(
  "/",
  query("sort").toLowerCase(),
  query("sortBy").toLowerCase(),
  async (req: HasPageRequest, res) => {
    const querySort = req.query.sort as string;
    const querySortBy = (req.query.sortBy as string) || "desc";
    const supportedSort = ["createdAt", "rating", "title"];
    const sort = supportedSort.includes(querySort) ? querySort : "createdAt";
    const sortBy = ["asc", "desc"].includes(querySortBy) ? querySortBy : "desc";

    const { rows: playlists, count } = await Playlist.findAndCountAll({
      limit: req.perPage,
      offset: req.offset,
      order: [[sort, sortBy]],
      where: {
        ...(req.query.search && {
          [Op.or]: [
            { title: { [Op.substring]: req.query.search } },
            { description: { [Op.substring]: req.query.search } },
          ],
        }),
      },
    });

    res.render("playlists/index", {
      playlists,
      count,
    });
  },
);

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
  res.render("playlists/show.pug", { playlist: req.playlist });
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
        .set("HX-Trigger", "data-saved")
        .render("playlists/_info", { playlist: req.playlist });
    } else {
      res
        .status(422)
        .set("HX-Trigger", "data-failed")
        .render("playlists/_info", {
          playlist: req.playlist,
          errors: errors.mapped(),
        });
    }
  },
);

router.get("/:playlist/play", async (req: PlaylistRequest, res) => {
  const firstItem = await Playlistable.findOne({
    include: [Medium, Chapter],
    order: [["order", "ASC"]],
    where: { playlistId: req.playlist.id },
  });

  if (!firstItem) {
    res.sendStatus(204);
    return;
  }

  const medium = firstItem?.medium;
  const chapter = firstItem?.chapter;

  mediaPlayer.play(medium?.url || "", chapter?.startTime, chapter?.endTime);

  const nextPlaylistable = await Playlistable.findOne({
    order: ["order"],
    where: {
      playlistId: req.playlist.id,
      order: { [Op.gt]: firstItem?.order },
    },
  });

  const count = await req.playlist.$count("playlistables");
  const randomOffset = Math.floor(Math.random() * count);
  const randomPlaylistable = await Playlistable.findOne({
    offset: randomOffset,
    order: ["order"],
    where: { playlistId: req.playlist.id },
  });

  res.render("player/show", {
    playlist: req.playlist,
    medium,
    chapter,
    from: `/playlists/${req.playlist.id}/playlistables`,
    first: `/playlists/${req.playlist.id}/playlistables/${firstItem.id}/play`,
    next: nextPlaylistable
      ? `/playlists/${req.playlist.id}/playlistables/${nextPlaylistable?.id}/play`
      : "",
    random: `/playlists/${req.playlist.id}/playlistables/${randomPlaylistable?.id}/play`,
  });
});

router.post("/:playlist/queue", async (req: PlaylistRequest, res) => {
  const playlistables = await Playlistable.findAll({
    order: [["order", "ASC"]],
    where: { playlistId: req.playlist.id },
  });

  await queue(playlistables);

  res.set("HX-Trigger", "refresh-play-queues").sendStatus(201);
});

router.put(
  "/:playlist/rating",
  body("rating").isInt({ min: 1, max: 5 }).optional(),
  async (req: PlaylistRequest, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      await req.playlist.update({ rating: req.body.rating || null });

      res.sendStatus(204);
    } else res.sendStatus(422);
  },
);

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

async function queue(playlistables: Playlistable[]) {
  const data: PlayQueueCreationAttributes[] = [];
  let order = Number(await PlayQueue.max("order")) + 1;

  for (const playlistable of playlistables)
    data.push({
      mediumId: playlistable.mediumId,
      chapterId: playlistable.chapterId,
      order: order++,
    });

  await PlayQueue.bulkCreate(data);
}

router.use("/:playlist/labels", labelRouter);
router.use("/:playlist/playlistables", playlistableRouter);
router.use("/:playlist/media", mediumRouter);

export default router;
