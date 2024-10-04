import { Router } from "express";
import { Op } from "sequelize";
import Chapter from "../database/models/chapter";
import Medium from "../database/models/medium";
import PlayQueue from "../database/models/play-queue";
import Playlist from "../database/models/playlist";
import PlaylistItem from "../database/models/playlist-item";
import mediaPlayer from "../src/media-player";

let playlist: Playlist | null;
let playlistItem: PlaylistItem | null;
let medium: Medium | null;
let chapter: Chapter | null;

export async function play(playable: Medium | Chapter | PlaylistItem) {
  chapter = null;
  playlist = null;
  playlistItem = null;

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
    playlistItem = playable;
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

export async function playNextPlaylistItem() {
  if (!playlistItem) return;

  playlistItem = await PlaylistItem.findOne({
    where: {
      playlistId: playlistItem.playlistId,
      order: { [Op.gt]: playlistItem.order },
    },
    order: [["order", "ASC"]],
  });

  if (!playlistItem) return;

  await play(playlistItem);
}

export async function playNextQueued() {
  const queued = await PlayQueue.findOne({
    order: [["order", "ASC"]],
    include: [Medium, Chapter],
  });

  if (!queued) return;

  await queued.destroy();
  await PlayQueue.decrement("order", {
    by: 1,
    where: { order: { [Op.gt]: queued.order } },
  });

  if (queued.chapter) await play(queued.chapter);
  else await play(queued.medium);
}

export default router;
