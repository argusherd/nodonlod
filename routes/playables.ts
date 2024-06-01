import { Request, Router } from "express";
import PlayQueue from "../database/models/play-queue";
import Playable from "../database/models/playable";
import mediaPlayer from "../src/media-player";
import wss from "./websocket";

interface PlayableRequest extends Request {
  playable: Playable;
}

const router = Router();

router.param("playable", async (req: PlayableRequest, res, next) => {
  const playable = await Playable.findByPk(req.params.playable);

  if (playable) {
    req.playable = playable;
    next();
  } else {
    res.sendStatus(404);
  }
});

router.get("/", async (_req, res) => {
  res.render("playables/index", {
    playables: await Playable.findAll(),
  });
});

router.get("/:playable", async (req: PlayableRequest, res) => {
  res.render("playables/show", {
    playable: req.playable,
    uploader: await req.playable.$get("uploader"),
    chapters: await req.playable.$get("chapters"),
    tags: await req.playable.$get("tags"),
    playlists: await req.playable.$get("playlists"),
  });
});

router.get("/:playable/play", (req: PlayableRequest, res) => {
  mediaPlayer.play(req.playable.url as string);

  wss.nowPlaying({ title: req.playable.title });

  res.sendStatus(202);
});

router.post("/:playable/queue", async (req: PlayableRequest, res) => {
  await PlayQueue.create({
    playableId: req.playable.id,
    order: Number(await PlayQueue.max("order")) + 1,
  });

  res.sendStatus(201);
});

router.delete("/:playable", async (req: PlayableRequest, res) => {
  await req.playable.destroy();

  res.sendStatus(204);
});

export default router;
