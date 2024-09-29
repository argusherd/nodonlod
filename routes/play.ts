import { Router } from "express";
import Medium from "../database/models/medium";
import mediaPlayer from "../src/media-player";

let medium: Medium;

export async function play(playable: Medium) {
  medium = playable;

  mediaPlayer.play(medium.url);
}

const router = Router();

router.get("/", (_req, res) => {
  res.render("play/show", { medium });
});

export default router;
