import { Request, Router } from "express";
import { body, validationResult } from "express-validator";
import { Op } from "sequelize";
import { MediumRequest } from ".";
import Chapter from "../../database/models/chapter";
import Medium from "../../database/models/medium";
import { __ } from "../middlewares/i18n";

interface ChapterRequest extends Request {
  chapter: Chapter;
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

router.get("/", async (req: MediumRequest, res) => {
  res.render("media/chapters/index", {
    medium: req.medium,
    chapters: await req.medium.$get("chapters"),
  });
});

router.get("/create", (req: MediumRequest, res) => {
  res
    .set("HX-Trigger", "open-modal")
    .render("media/chapters/_form.pug", { medium: req.medium });
});

router.post(
  "/",
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
      res.status(422).render("media/chapters/_form.pug", {
        medium: req.medium,
        errors: errors.mapped(),
      });
    }
  },
);

router.get(
  "/:chapter/edit",
  async (req: MediumRequest & ChapterRequest, res) => {
    res.set("HX-Trigger", "open-modal").render("media/chapters/_form.pug", {
      chapter: req.chapter,
      medium: req.medium,
    });
  },
);

router.put(
  "/:chapter",
  validateTitle(),
  validateStartTime(),
  validateEndTime(),
  validateDuplicate(),
  async (req: MediumRequest & ChapterRequest, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      const { title, startTime, endTime } = req.body;

      await req.chapter.update({ title, startTime, endTime });

      res.set("HX-Trigger", "refresh-chapters, close-modal").sendStatus(205);
    } else {
      res.status(422).render("media/chapters/_form.pug", {
        medium: req.medium,
        chapter: req.chapter,
        errors: errors.mapped(),
      });
    }
  },
);

export default router;
