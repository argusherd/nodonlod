import { Request, Router } from "express";
import Chapter from "../database/models/chapter";
import PlayQueue from "../database/models/play-queue";
import Playable from "../database/models/playable";
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
  const playable = (await req.chapter.$get("playable")) as Playable;
  const { title: chapter, startTime, endTime } = req.chapter;

  mediaPlayer.play(playable.url, startTime, endTime);

  wss.nowPlaying({ title: playable.title, chapter, startTime, endTime });

  res.sendStatus(202);
});

router.post("/:chapter/queue", async (req: ChapterRequest, res) => {
  await PlayQueue.create({
    playableId: req.chapter.playableId,
    chapterId: req.chapter.id,
    order: Number(await PlayQueue.max("order")) + 1,
  });

  res.sendStatus(201);
});

router.delete("/:chapter", async (req: ChapterRequest, res) => {
  await req.chapter.destroy();

  res.sendStatus(204);
});

export default router;
