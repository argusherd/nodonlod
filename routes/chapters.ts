import { Request, Router } from "express";
import Chapter from "../database/models/chapter";
import Medium from "../database/models/medium";
import PlayQueue from "../database/models/play-queue";
import mediaPlayer from "../src/media-player";
import wss from "./websocket";

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
  const medium = (await req.chapter.$get("medium")) as Medium;
  const { startTime, endTime } = req.chapter;

  mediaPlayer.play(medium.url, startTime, endTime);
  wss.nowPlaying(medium, req.chapter);

  res.sendStatus(202);
});

router.post("/:chapter/queue", async (req: ChapterRequest, res) => {
  await PlayQueue.create({
    mediumId: req.chapter.mediumId,
    chapterId: req.chapter.id,
    order: Number(await PlayQueue.max("order")) + 1,
  });

  res.set("HX-Trigger", "refresh-play-queues").sendStatus(201);
});

router.delete("/:chapter", async (req: ChapterRequest, res) => {
  await req.chapter.destroy();

  res.sendStatus(204);
});

export default router;
