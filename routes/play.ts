import { Router } from "express";
import { currentlyPlaying } from "../src/currently-playing";

const router = Router();

router.get("/", (_req, res) => {
  const { playlist, medium, chapter } = currentlyPlaying;

  res.render("play/show", { playlist, medium, chapter });
});

export default router;
