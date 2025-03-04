import { Request, Router } from "express";
import Chapter from "../../database/models/chapter";
import PlayQueue from "../../database/models/play-queue";
import { play } from "../../src/currently-playing";
import { __ } from "../middlewares/i18n";

interface ChapterRequest extends Request {
  chapter: Chapter;
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

router.get("/:chapter/play", async (req: ChapterRequest, res) => {
  await play(req.chapter);

  res.set("HX-Trigger", "show-playing").sendStatus(202);
});

router.post("/:chapter/queue", async (req: ChapterRequest, res) => {
  await PlayQueue.create({
    mediumId: req.chapter.mediumId,
    chapterId: req.chapter.id,
    order: Number(await PlayQueue.max("order")) + 1,
  });

  res.set("HX-Trigger", "refresh-play-queues").sendStatus(201);
});

router.delete("/:chapter/confirm", (req: ChapterRequest, res) => {
  res.set("HX-Trigger", "open-modal").render("_delete", {
    message: __(`Are you sure you want to delete the chapter: "{{title}}"?`, {
      title: req.chapter.title,
    }),
    route: `/chapters/${req.chapter.id}`,
  });
});

router.delete("/:chapter", async (req: ChapterRequest, res) => {
  await req.chapter.destroy();

  res.set("HX-Trigger", "refresh-chapters").sendStatus(205);
});

export default router;
