import { Router } from "express";
import { body, query, validationResult } from "express-validator";
import { Op } from "sequelize";
import Extraction from "../../database/models/extraction";
import Medium from "../../database/models/medium";
import Performer from "../../database/models/performer";
import PlayQueue from "../../database/models/play-queue";
import mediaPlayer from "../../src/media-player";
import { __ } from "../middlewares/i18n";
import { HasPageRequest } from "../middlewares/pagination";
import chapterRouter from "./chapters";
import labelRouter from "./labels";
import performerRouter from "./performers";
import playlistRouter from "./playlists";

export interface MediumRequest extends HasPageRequest {
  medium: Medium;
}

const router = Router();
const supportedSort = ["createdAt", "duration", "playCount", "rating", "title"];
const getSortAndSortBy = (req: HasPageRequest): [string, string] => {
  const querySort = req.query.sort as string;
  const querySortBy = req.query.sortBy as string;
  const sort = supportedSort.includes(querySort) ? querySort : "createdAt";
  console.log(req.url);
  console.log(querySort, supportedSort.includes(querySort), sort);
  const sortBy = ["asc", "desc"].includes(querySortBy) ? querySortBy : "desc";

  return [sort, sortBy];
};

router.param("medium", async (req: MediumRequest, res, next) => {
  const medium = await Medium.findByPk(req.params.medium);

  if (medium) {
    req.medium = medium;
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
    const [sort, sortBy] = getSortAndSortBy(req);

    const { rows: media, count } = await Medium.findAndCountAll({
      limit: req.perPage,
      include: [{ model: Performer, order: [["name", "ASC"]] }],
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

    res.render("media/index", {
      media,
      count,
    });
  },
);

router.get("/:medium", async (req: MediumRequest, res) => {
  res.render("media/show", {
    medium: req.medium,
    uploader: await req.medium.$get("uploader"),
    performers: await req.medium.$get("performers", {
      order: [["name", "ASC"]],
    }),
  });
});

router.put(
  "/:medium",
  body("title").notEmpty().withMessage(__("The title is missing.")),
  body("url").notEmpty().withMessage(__("The URL is missing.")),
  async (req: MediumRequest, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      if (req.body.url != req.medium.url) {
        await Extraction.create({ url: req.body.url });
        await req.medium.update({ hasError: null });
      }

      await req.medium.update({
        title: req.body.title,
        url: req.body.url,
        thumbnail: req.body.thumbnail,
        description: req.body.description,
      });

      res.set("HX-Trigger", "data-saved");
    } else {
      res.set("HX-Trigger", "data-failed").status(422);
    }

    res.render("media/_info.pug", {
      medium: req.medium,
      uploader: await req.medium.$get("uploader"),
      performers: await req.medium.$get("performers"),
      errors: errors.mapped(),
    });
  },
);

router.get("/:medium/play", async (req: MediumRequest, res) => {
  const [sort, sortBy] = getSortAndSortBy(req);

  mediaPlayer.play(req.medium.url);

  const nextMedium = await Medium.findOne({
    limit: 1,
    order: [[sort, sortBy]],
    where: {
      id: { [Op.ne]: req.medium.id },
      [sort]:
        sortBy == "desc"
          ? { [Op.lte]: req.medium.get(sort) }
          : { [Op.gte]: req.medium.get(sort) },
    },
  });
  const firstMedium = await Medium.findOne({ order: [[sort, sortBy], "id"] });
  const count = await Medium.count();
  const randomOffset = Math.floor(Math.random() * count);
  const randomMedium = await Medium.findOne({
    offset: randomOffset,
  });

  res.render("player/show", {
    medium: req.medium,
    from: `/media/${req.medium.id}`,
    first: `/media/${firstMedium?.id}/play`,
    next: nextMedium ? `/media/${nextMedium?.id}/play` : "",
    random: `/media/${randomMedium?.id}/play`,
  });
});

router.get(
  "/:medium/adjacent",
  query("sort").toLowerCase(),
  query("sortBy").toLowerCase(),
  async (req: MediumRequest, res) => {
    const [sort, sortBy] = getSortAndSortBy(req);

    let next = await Medium.findOne({
      limit: 1,
      order: [[sort, sortBy]],
      where: {
        id: { [Op.ne]: req.medium.id },
        [sort]:
          sortBy == "desc"
            ? { [Op.lte]: req.medium.get(sort) }
            : { [Op.gte]: req.medium.get(sort) },
      },
    });

    if (!next)
      next = await Medium.findOne({
        limit: 1,
        order: [[sort, sortBy]],
      });

    const reversedSortBy = sortBy == "desc" ? "asc" : "desc";

    let previous = await Medium.findOne({
      limit: 1,
      order: [[sort, reversedSortBy]],
      where: {
        id: { [Op.ne]: req.medium.id },
        [sort]:
          reversedSortBy == "desc"
            ? { [Op.lte]: req.medium.get(sort) }
            : { [Op.gte]: req.medium.get(sort) },
      },
    });

    if (!previous)
      previous = await Medium.findOne({
        limit: 1,
        order: [[sort, reversedSortBy]],
      });

    res.render("media/_adjacent", { medium: req.medium, previous, next });
  },
);

router.post("/:medium/queue", async (req: MediumRequest, res) => {
  await PlayQueue.create({
    mediumId: req.medium.id,
    order: Number(await PlayQueue.max("order")) + 1,
  });

  res.set("HX-Trigger", "refresh-play-queues").sendStatus(201);
});

router.put(
  "/:medium/rating",
  body("rating").isInt({ min: 1, max: 5 }).optional(),
  async (req: MediumRequest, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      await req.medium.update({ rating: req.body.rating || null });

      res.sendStatus(204);
    } else res.sendStatus(422);
  },
);

router.put("/:medium/play-count", async (req: MediumRequest, res) => {
  await req.medium.increment("playCount");

  res.sendStatus(204);
});

router.put("/:medium/error", async (req: MediumRequest, res) => {
  await req.medium.update({ hasError: req.body.message });

  res.sendStatus(204);
});

router.put("/:medium/succeed", async (req: MediumRequest, res) => {
  await req.medium.update({ hasError: null });

  res.sendStatus(204);
});

router.delete("/:medium/confirm", async (req: MediumRequest, res) => {
  res.set("HX-Trigger", "open-modal").render("_delete", {
    message: __("Are you sure you want to delete this medium?"),
    route: `/media/${req.medium.id}`,
  });
});

router.delete("/:medium", async (req: MediumRequest, res) => {
  await req.medium.destroy();

  res.set("HX-Location", "/media").sendStatus(204);
});

router.use("/:medium/chapters", chapterRouter);
router.use("/:medium/playlists", playlistRouter);
router.use("/:medium/performers", performerRouter);
router.use("/:medium/labels", labelRouter);

export default router;
