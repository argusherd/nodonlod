import { Router } from "express";
import Chapter from "../database/models/chapter";
import Medium from "../database/models/medium";
import Playlist from "../database/models/playlist";
import PlaylistItem from "../database/models/playlist-item";
import mediaPlayer from "../src/media-player";

let playlist: Playlist | null;
let medium: Medium | null;
let chapter: Chapter | null;

export async function play(playable: Medium | Chapter | PlaylistItem) {
  chapter = null;
  playlist = null;

  if (playable instanceof Medium) {
    medium = playable;

    mediaPlayer.play(medium.url);
  } else if (playable instanceof Chapter) {
    medium = (await playable.$get("medium")) as Medium;
    chapter = playable;

    const { startTime, endTime } = chapter;

    mediaPlayer.play(medium.url, startTime, endTime);
  } else if (playable instanceof PlaylistItem) {
    playlist = await playable.$get("playlist");
    medium = (await playable.$get("medium")) as Medium;
    chapter = await playable.$get("chapter");
    const { startTime, endTime } = chapter || { startTime: 0, endTime: 0 };

    mediaPlayer.play(medium.url, startTime, endTime);
  }
}

const router = Router();

router.get("/", (_req, res) => {
  res.render("play/show", { playlist, medium, chapter });
});

export default router;
