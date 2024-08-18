import { Request, Router } from "express";
import { body, validationResult } from "express-validator";
import Chapter from "../database/models/chapter";
import Medium from "../database/models/medium";
import PlayQueue from "../database/models/play-queue";
import mediaPlayer from "../src/media-player";
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
    const errors = validationResult(req);
    const startTime = Number(req.body.startTime);
    const endTime = Number(req.body.endTime);

    if (
      !errors.isEmpty() ||
      startTime >= endTime ||
      endTime > req.medium.duration
    ) {
      res.sendStatus(422);
      return;
    }

    await Chapter.create({
      mediumId: req.medium.id,
      title: req.body.title,
      startTime,
      endTime,
    });

    res.set("HX-Location", `/media/${req.medium.id}`).sendStatus(201);
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
    const medium = (await req.chapter.$get("medium")) as Medium;
    const errors = validationResult(req);
    const startTime = Number(req.body.startTime);
    const endTime = Number(req.body.endTime);

    if (
      !errors.isEmpty() ||
      startTime >= endTime ||
      endTime > medium.duration
    ) {
      res.sendStatus(422);
      return;
    }

    const title = req.body.title;

    await req.chapter.update({ title, startTime, endTime });

    res.set("HX-Location", `/media/${medium.id}`).sendStatus(205);
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

router.delete("/chapters/:chapter", async (req: ChapterRequest, res) => {
  await req.chapter.destroy();

  res.sendStatus(205);
});

export default router;
