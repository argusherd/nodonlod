import { Router } from "express";
import mediaPlayer from "../src/media-player";

const router = Router();

router.put("/pause", (_req, res) => {
  mediaPlayer.pause();
  res.render("player/_resume.pug");
});

router.put("/resume", (_req, res) => {
  mediaPlayer.resume();
  res.render("player/_pause.pug");
});

router.put("/stop", (_req, res) => {
  mediaPlayer.stop();
  res.sendStatus(204);
});

router.put("/seek", (req, res) => {
  mediaPlayer.seek(Number(req.body.seek));
  res.sendStatus(204);
});

router.put("/replay", (_req, res) => {
  mediaPlayer.replay();
  res.sendStatus(204);
});

export default router;
