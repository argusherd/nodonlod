import { Request, Router } from "express";
import Medium from "../database/models/medium";
import PlayQueue from "../database/models/play-queue";
import mediaPlayer from "../src/media-player";
import wss from "./websocket";

interface MediumRequest extends Request {
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

router.get("/", async (_req, res) => {
  res.render("media/index", {
    media: await Medium.findAll(),
  });
});

router.get("/:medium", async (req: MediumRequest, res) => {
  res.render("media/show", {
    medium: req.medium,
    uploader: await req.medium.$get("uploader"),
    chapters: await req.medium.$get("chapters"),
    tags: await req.medium.$get("tags"),
    playlists: await req.medium.$get("playlists"),
  });
});

router.get("/:medium/play", (req: MediumRequest, res) => {
  mediaPlayer.play(req.medium.url as string);

  wss.nowPlaying({ title: req.medium.title });

  res.sendStatus(202);
});

router.post("/:medium/queue", async (req: MediumRequest, res) => {
  await PlayQueue.create({
    mediumId: req.medium.id,
    order: Number(await PlayQueue.max("order")) + 1,
  });

  res.set("HX-Trigger", "play-queue").sendStatus(201);
});

router.delete("/:medium", async (req: MediumRequest, res) => {
  await req.medium.destroy();

  res.sendStatus(204);
});

export default router;
