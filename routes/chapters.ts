import dayjs from "dayjs";
import { Request, Router } from "express";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import Chapter from "../database/models/chapter";
import Medium from "../database/models/medium";
import PlayQueue from "../database/models/play-queue";
import mediaPlayer from "../src/media-player";
import { i18n } from "./middlewares/i18n";
import wss from "./websocket";

interface ChapterRequest extends Request {
  chapter: Chapter;
}

interface MediumRequest extends Request {
  medium: Medium;
}

const router = Router();

router.param("chapter", async (req: ChapterRequest, res, next) => {
  const chapter = await Chapter.findByPk(req.params.chapter);

  if (chapter) {
    req.chapter = chapter;
    next();
  } else {
    res.sendStatus(404);
  }
});

router.param("medium", async (req: MediumRequest, res, next) => {
  const medium = await Medium.findByPk(req.params.medium);

  if (medium) {
    req.medium = medium;
    next();
  } else {
    res.sendStatus(404);
  }
});

router.get("/media/:medium/chapters", async (req: MediumRequest, res) => {
  res.render("chapters/index.pug", {
    medium: req.medium,
    chapters: await req.medium.$get("chapters"),
  });
});

router.get("/media/:medium/chapters/create", (req: MediumRequest, res) => {
  res
    .set("HX-Trigger", "show-chapter-form")
    .render("chapters/_form.pug", { medium: req.medium });
});

router.post(
  "/media/:medium/chapters",
  body("title").notEmpty(),
  body("startTime").isNumeric({ no_symbols: true }),
  body("endTime").isNumeric({ no_symbols: true }),
  async (req: MediumRequest, res) => {
    const medium = req.medium;
    const errors = validationResult(req);
    const startTime = isNaN(req.body.startTime)
      ? 0
      : Number(req.body.startTime);
    const endTime = isNaN(req.body.endTime) ? 0 : Number(req.body.endTime);
    const exists = await Chapter.count({
      where: { startTime, endTime, mediumId: medium.id },
    });

    let error = errors.array().at(0)?.msg;

    if (exists)
      error = i18n.__(
        "The given start time and end time already exist for the medium.",
      );
    else if (startTime >= endTime)
      error = i18n.__("The end time should be greater than the start time.");
    else if (endTime > medium.duration)
      error = i18n.__(
        "The start time and the end time should fall within the duration ({{duration}}) of the medium.",
        { duration: dayjs.neatDuration(medium.duration) },
      );

    if (error) {
      res.status(422).render("chapters/_form.pug", { medium, error });
      return;
    }

    await Chapter.create({
      mediumId: req.medium.id,
      title: req.body.title,
      startTime,
      endTime,
    });

    res.set("HX-Trigger", "refresh-chapters").sendStatus(201);
  },
);

router.get("/chapters/:chapter/edit", async (req: ChapterRequest, res) => {
  res.set("HX-Trigger", "show-chapter-form").render("chapters/_form.pug", {
    chapter: req.chapter,
    medium: await req.chapter.$get("medium"),
  });
});

router.put(
  "/chapters/:chapter",
  body("title").notEmpty(),
  body("startTime").isNumeric({ no_symbols: true }),
  body("endTime").isNumeric({ no_symbols: true }),
  async (req: ChapterRequest, res) => {
    const chpater = req.chapter;
    const medium = (await chpater.$get("medium")) as Medium;
    const errors = validationResult(req);
    const startTime = isNaN(req.body.startTime)
      ? 0
      : Number(req.body.startTime);
    const endTime = isNaN(req.body.endTime) ? 0 : Number(req.body.endTime);
    const exists = await Chapter.count({
      where: {
        startTime,
        endTime,
        mediumId: medium.id,
        id: { [Op.ne]: chpater.id },
      },
    });

    let error = errors.array().at(0)?.msg;

    if (exists)
      error = i18n.__(
        "The given start time and end time already exist for the medium.",
      );
    else if (startTime >= endTime)
      error = i18n.__("The end time should be greater than the start time.");
    else if (endTime > medium.duration)
      error = i18n.__(
        "The start time and the end time should fall within the duration ({{duration}}) of the medium.",
        { duration: dayjs.neatDuration(medium.duration) },
      );

    if (error) {
      res
        .status(422)
        .render("chapters/_form.pug", { medium, error, chapter: chpater });
      return;
    }

    const title = req.body.title;

    await chpater.update({ title, startTime, endTime });

    res.set("HX-Trigger", "refresh-chapters").sendStatus(205);
  },
);

router.get("/chapters/:chapter/play", async (req: ChapterRequest, res) => {
  const medium = (await req.chapter.$get("medium")) as Medium;
  const { startTime, endTime } = req.chapter;

  mediaPlayer.play(medium.url, startTime, endTime);
  wss.nowPlaying(medium, req.chapter);

  res.sendStatus(202);
});

router.post("/chapters/:chapter/queue", async (req: ChapterRequest, res) => {
  await PlayQueue.create({
    mediumId: req.chapter.mediumId,
    chapterId: req.chapter.id,
    order: Number(await PlayQueue.max("order")) + 1,
  });

  res.set("HX-Trigger", "refresh-play-queues").sendStatus(201);
});

router.delete("/chapters/:chapter/confirm", (req: ChapterRequest, res) => {
  res.set("HX-Trigger", "open-modal").render("_delete", {
    chapter: req.chapter,
    message: i18n.__(`Are you sure you want to delete the chapter {{title}}?`, {
      title: req.chapter.title,
    }),
    route: `/chapters/${req.chapter.id}`,
  });
});

router.delete("/chapters/:chapter", async (req: ChapterRequest, res) => {
  await req.chapter.destroy();

  res.set("HX-Trigger", "refresh-chapters").sendStatus(205);
});

export default router;
