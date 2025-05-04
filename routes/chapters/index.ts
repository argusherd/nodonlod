import { Router } from "express";
import { Op } from "sequelize";
import Chapter from "../../database/models/chapter";
import Medium from "../../database/models/medium";
import PlayQueue from "../../database/models/play-queue";
import mediaPlayer from "../../src/media-player";
import { __ } from "../middlewares/i18n";
import { HasPageRequest } from "../middlewares/pagination";
import playlistRouter from "./playlists";

export interface ChapterRequest extends HasPageRequest {
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

  mediaPlayer.play(medium.url, req.chapter.startTime, req.chapter.endTime);

  let nextChapter = await Chapter.findOne({
    where: {
      startTime: { [Op.gt]: req.chapter.startTime },
      mediumId: medium.id,
    },
    order: ["startTime"],
  });

  if (!nextChapter)
    nextChapter = await Chapter.findOne({
      where: { mediumId: medium.id },
      order: ["startTime"],
    });

  const count = await medium.$count("chapters");
  const randomOffset = Math.floor(Math.random() * count);
  const randomChapter = await Chapter.findOne({
    where: { mediumId: medium.id },
    offset: randomOffset,
    order: ["startTime"],
  });

  res.render("player/show", {
    medium,
    chapter: req.chapter,
    from: `/media/${medium.id}/chapters`,
    next: `/chapters/${nextChapter?.id}/play`,
    random: `/chapters/${randomChapter?.id}/play`,
  });
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

router.use("/:chapter/playlists", playlistRouter);

export default router;
