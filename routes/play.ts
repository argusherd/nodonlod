import { Router } from "express";
import PlayQueue from "../database/models/play-queue";
import {
  currentlyPlaying,
  playNextMedium,
  playNextPlaylistItem,
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
  if (currentlyPlaying.playlistItem) await playNextPlaylistItem();
  else if (await PlayQueue.count()) await playNextQueued();
  else if (req.body.isRandom) await playNextRandom();
  else await playNextMedium();

  res
    .set(
      "HX-Trigger",
      `show-playing, ${playStatus.isLastOne ? "last-one-played" : "not-last-one"}`,
    )
    .sendStatus(205);
});

export default router;
