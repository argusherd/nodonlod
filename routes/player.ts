import { Router } from "express";
import mediaPlayer from "../src/media-player";

const router = Router();

router.put("/pause", (_req, res) => {
  mediaPlayer.pause();
  res.sendStatus(204);
});

router.put("/resume", (_req, res) => {
  mediaPlayer.resume();
  res.sendStatus(204);
});

export default router;
