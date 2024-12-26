import { Request, Router } from "express";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import Chapter from "../database/models/chapter";
import Medium from "../database/models/medium";
import PlayQueue from "../database/models/play-queue";
import { play } from "../src/currently-playing";
import { __ } from "./middlewares/i18n";

interface ChapterRequest extends Request {
  chapter: Chapter;
}

interface MediumRequest extends Request {
  medium: Medium;
}

const router = Router();

const validateTitle = () =>
  body("title").trim().notEmpty().withMessage(__("The title is missing."));

const validateStartTime = () =>
  body("startTime")
    .notEmpty({ ignore_whitespace: true })
    .withMessage(__("The start time is missing."))
    .toInt()
    .isNumeric({ no_symbols: true })
    .withMessage("The start time should be a positive integer.");

const validateEndTime = () =>
  body("endTime")
    .notEmpty()
    .withMessage(__("The end time is missing."))
    .toInt()
    .isNumeric({ no_symbols: true })
    .withMessage("The end time should be a positive integer.")
    .custom((value, { req }) => value > req.body.startTime)
    .withMessage(__("The end time should be greater than the start time."))
    .custom(async (value, { req }) => {
      const medium: Medium = req.medium || (await req.chapter.$get("medium"));

      if (value > medium.duration)
        throw new Error(
          __(
            "The start time and the end time should fall within the duration.",
          ),
        );
    });

const validateDuplicate = () =>
  body("startTime").custom(async (_value, { req }) => {
    const duplicated = await Chapter.count({
      where: {
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        ...(req.medium && { mediumId: req.medium.id }),
        ...(req.chapter && { id: { [Op.ne]: req.chapter.id } }),
      },
    });

    if (duplicated)
      throw new Error(
        __("The given start time and end time already exist for the medium."),
      );
  });

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
    .set("HX-Trigger", "open-modal")
    .render("chapters/_form.pug", { medium: req.medium });
});

router.post(
  "/media/:medium/chapters",
  validateTitle(),
  validateStartTime(),
  validateEndTime(),
  validateDuplicate(),
  async (req: MediumRequest, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      await Chapter.create({
        mediumId: req.medium.id,
        title: req.body.title,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
      });

      res.set("HX-Trigger", "refresh-chapters, close-modal").sendStatus(201);
    } else {
      res.status(422).render("chapters/_form.pug", {
        medium: req.medium,
        errors: errors.mapped(),
      });
    }
  },
);

router.get("/chapters/:chapter/edit", async (req: ChapterRequest, res) => {
  res.set("HX-Trigger", "open-modal").render("chapters/_form.pug", {
    chapter: req.chapter,
    medium: await req.chapter.$get("medium"),
  });
});

router.put(
  "/chapters/:chapter",
  validateTitle(),
  validateStartTime(),
  validateEndTime(),
  validateDuplicate(),
  async (req: ChapterRequest, res) => {
    const chapter = req.chapter;
    const medium = (await chapter.$get("medium")) as Medium;
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      const { title, startTime, endTime } = req.body;

      await chapter.update({ title, startTime, endTime });

      res.set("HX-Trigger", "refresh-chapters, close-modal").sendStatus(205);
    } else {
      res.status(422).render("chapters/_form.pug", {
        medium,
        chapter,
        errors: errors.mapped(),
      });
    }
  },
);

router.get("/chapters/:chapter/play", async (req: ChapterRequest, res) => {
  await play(req.chapter);

  res.set("HX-Trigger", "show-playing").sendStatus(202);
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
    message: __(`Are you sure you want to delete the chapter: "{{title}}"?`, {
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
