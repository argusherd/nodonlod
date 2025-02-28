import { Router } from "express";
import {
  currentlyPlaying,
  playNextMedium,
  playNextPlaylistable,
  playNextQueued,
  playNextRandom,
  playStatus,
} from "../src/currently-playing";

const router = Router();

router.get("/", (_req, res) => {
  const { playlist, medium, chapter } = currentlyPlaying;

  res.render("play/show", { playlist, medium, chapter });
});

router.put("/next", async (req, res) => {
  if (req.body.isRandom) await playNextRandom();
  else if (currentlyPlaying.playlistable) await playNextPlaylistable();
  else if (currentlyPlaying.playQueue) await playNextQueued();
  else await playNextMedium();

  res
    .set(
      "HX-Trigger",
      `show-playing, ${playStatus.isLastOne ? "last-one-played" : "not-last-one"}`,
    )
    .sendStatus(205);
});

export default router;
