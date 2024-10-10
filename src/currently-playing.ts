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
  playQueue: PlayQueue | null;
  medium: Medium | null;
  chapter: Chapter | null;
} = {
  playlist: null,
  playlistItem: null,
  playQueue: null,
  medium: null,
  chapter: null,
};

export async function play(
  playable: Medium | Chapter | PlaylistItem | PlayQueue | null,
) {
  currentlyPlaying.medium = null;
  currentlyPlaying.chapter = null;
  currentlyPlaying.playlist = null;
  currentlyPlaying.playlistItem = null;
  currentlyPlaying.playQueue = null;

  if (!playable) return;

  let startTime = 0;
  let endTime = 0;

  if (playable instanceof Medium) {
    currentlyPlaying.medium = playable;

    mediaPlayer.play(currentlyPlaying.medium.url);
  } else if (playable instanceof Chapter) {
    currentlyPlaying.medium = (await playable.$get("medium")) as Medium;
    currentlyPlaying.chapter = playable;

    ({ startTime, endTime } = currentlyPlaying.chapter);
  } else if (playable instanceof PlaylistItem) {
    currentlyPlaying.playlist = await playable.$get("playlist");
    currentlyPlaying.playlistItem = playable;
    currentlyPlaying.medium = (await playable.$get("medium")) as Medium;
    currentlyPlaying.chapter = await playable.$get("chapter");
    ({ startTime, endTime } = currentlyPlaying.chapter || {
      startTime: 0,
      endTime: 0,
    });
  } else if (playable instanceof PlayQueue) {
    currentlyPlaying.playQueue = playable;
    currentlyPlaying.medium = (await playable.$get("medium")) as Medium;
    currentlyPlaying.chapter = await playable.$get("chapter");
    ({ startTime, endTime } = currentlyPlaying.chapter || {
      startTime: 0,
      endTime: 0,
    });
  }

  if (currentlyPlaying.medium)
    mediaPlayer.play(currentlyPlaying.medium.url, startTime, endTime);
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
  const lastOrder = await PlayQueue.max("order");
  const queued = await PlayQueue.findOne({
    where: {
      ...(currentlyPlaying.playQueue &&
      currentlyPlaying.playQueue.order != lastOrder
        ? { order: { [Op.gt]: currentlyPlaying.playQueue.order } }
        : {}),
    },
    order: [["order", "ASC"]],
    include: [Medium, Chapter],
  });

  await play(queued);
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
