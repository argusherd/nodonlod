import { Request, Router } from "express";
import Chapter from "../database/models/chapter";
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

export default router;
