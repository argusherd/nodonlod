import { Op, literal } from "sequelize";
import Chapter from "../database/models/chapter";
import Medium from "../database/models/medium";
import PlayQueue from "../database/models/play-queue";
import Playlist from "../database/models/playlist";
import PlaylistItem from "../database/models/playlist-item";
import mediaPlayer from "./media-player";

export const currentlyPlaying: {
  playlist: Playlist | null;
  playlistItem: PlaylistItem | null;
  medium: Medium | null;
  chapter: Chapter | null;
} = {
  playlist: null,
  playlistItem: null,
  medium: null,
  chapter: null,
};

export async function play(playable: Medium | Chapter | PlaylistItem | null) {
  currentlyPlaying.medium = null;
  currentlyPlaying.chapter = null;
  currentlyPlaying.playlist = null;
  currentlyPlaying.playlistItem = null;

  if (playable instanceof Medium) {
    currentlyPlaying.medium = playable;

    mediaPlayer.play(currentlyPlaying.medium.url);
  } else if (playable instanceof Chapter) {
    currentlyPlaying.medium = (await playable.$get("medium")) as Medium;
    currentlyPlaying.chapter = playable;

    const { startTime, endTime } = currentlyPlaying.chapter;

    mediaPlayer.play(currentlyPlaying.medium.url, startTime, endTime);
  } else if (playable instanceof PlaylistItem) {
    currentlyPlaying.playlist = await playable.$get("playlist");
    currentlyPlaying.playlistItem = playable;
    currentlyPlaying.medium = (await playable.$get("medium")) as Medium;
    currentlyPlaying.chapter = await playable.$get("chapter");
    const { startTime, endTime } = currentlyPlaying.chapter || {
      startTime: 0,
      endTime: 0,
    };

    mediaPlayer.play(currentlyPlaying.medium.url, startTime, endTime);
  }
}

export async function playNextPlaylistItem() {
  if (!currentlyPlaying.playlistItem) return;

  const playlistItem = await PlaylistItem.findOne({
    where: {
      playlistId: currentlyPlaying.playlistItem.playlistId,
      order: { [Op.gt]: currentlyPlaying.playlistItem.order },
    },
    order: [["order", "ASC"]],
  });

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

export async function playNextMedium() {
  const medium = await Medium.findOne({
    where: {
      ...(currentlyPlaying.medium && {
        createdAt: { [Op.lte]: currentlyPlaying.medium.createdAt },
        id: { [Op.ne]: currentlyPlaying.medium.id },
      }),
    },
    order: [["createdAt", "DESC"]],
  });

  await play(medium);
}

export async function playNextRandom() {
  const medium = await Medium.findOne({
    order: literal("random()"),
  });

  await play(medium);
}
