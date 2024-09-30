import { Router } from "express";
import Chapter from "../database/models/chapter";
import Medium from "../database/models/medium";
import mediaPlayer from "../src/media-player";

let medium: Medium | null;
let chapter: Chapter | null;

export async function play(playable: Medium | Chapter) {
  chapter = null;

  if (playable instanceof Medium) {
    medium = playable;

    mediaPlayer.play(medium.url);
  } else if (playable instanceof Chapter) {
    medium = (await playable.$get("medium")) as Medium;
    chapter = playable;

    const { startTime, endTime } = chapter;

    mediaPlayer.play(medium.url, startTime, endTime);
  }
}

const router = Router();

router.get("/", (_req, res) => {
  res.render("play/show", { medium, chapter });
});

export default router;
