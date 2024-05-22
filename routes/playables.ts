import { Request, Router } from "express";
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

export default router;
