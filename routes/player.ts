import { Router } from "express";
import mediaPlayer from "../src/media-player";

const router = Router();

router.put("/pause", (_req, res) => {
  mediaPlayer.pause();
  res.sendStatus(205);
});

router.put("/resume", (_req, res) => {
  mediaPlayer.resume();
  res.sendStatus(205);
});

router.put("/stop", (_req, res) => {
  mediaPlayer.stop();
  res.sendStatus(205);
});

router.put("/seek", (req, res) => {
  mediaPlayer.seek(Number(req.body.seek));
  res.sendStatus(205);
});

router.put("/replay", (_req, res) => {
  mediaPlayer.replay();
  res.sendStatus(205);
});

export default router;
