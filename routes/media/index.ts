import { Router } from "express";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
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

router.param("medium", async (req: MediumRequest, res, next) => {
  const medium = await Medium.findByPk(req.params.medium);

  if (medium) {
    req.medium = medium;
    next();
  } else {
    res.sendStatus(404);
  }
});

router.get("/", async (req: HasPageRequest, res) => {
  const { rows: media, count } = await Medium.findAndCountAll({
    limit: req.perPage,
    include: [{ model: Performer, order: [["name", "ASC"]] }],
    offset: req.offset,
    order: [["createdAt", "DESC"]],
  });

  res.render("media/index", {
    media,
    count,
  });
});

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
  mediaPlayer.play(req.medium.url);

  let nextMedium = await Medium.findOne({
    where: {
      createdAt: { [Op.lte]: req.medium.createdAt },
      id: { [Op.not]: req.medium.id },
    },
    order: [["createdAt", "DESC"], "id"],
  });

  if (!nextMedium)
    nextMedium = await Medium.findOne({ order: [["createdAt", "DESC"], "id"] });

  const count = await Medium.count();
  const randomOffset = Math.floor(Math.random() * count);
  const randomMedium = await Medium.findOne({
    offset: randomOffset,
  });

  res.render("player/show", {
    medium: req.medium,
    from: `/media/${req.medium.id}`,
    next: `/media/${nextMedium?.id}/play`,
    random: `/media/${randomMedium?.id}/play`,
  });
});

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
