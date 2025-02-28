import { Op, literal } from "sequelize";
import Chapter from "../database/models/chapter";
import Medium from "../database/models/medium";
import PlayQueue from "../database/models/play-queue";
import Playlist from "../database/models/playlist";
import Playlistable from "../database/models/playlistable";
import mediaPlayer from "./media-player";

export const playStatus = { isLastOne: false };

export const currentlyPlaying: {
  playlist: Playlist | null;
  playlistable: Playlistable | null;
  playQueue: PlayQueue | null;
  medium: Medium | null;
  chapter: Chapter | null;
} = {
  playlist: null,
  playlistable: null,
  playQueue: null,
  medium: null,
  chapter: null,
};

export async function play(
  playable: Medium | Chapter | Playlistable | PlayQueue | null,
) {
  currentlyPlaying.medium = null;
  currentlyPlaying.chapter = null;
  currentlyPlaying.playlist = null;
  currentlyPlaying.playlistable = null;
  currentlyPlaying.playQueue = null;

  if (!playable) return;

  if (playable instanceof Medium) {
    currentlyPlaying.medium = playable;
  } else if (playable instanceof Chapter) {
    currentlyPlaying.medium = (await playable.$get("medium")) as Medium;
    currentlyPlaying.chapter = playable;
  } else if (playable instanceof Playlistable) {
    currentlyPlaying.playlist = await playable.$get("playlist");
    currentlyPlaying.playlistable = playable;
    currentlyPlaying.medium = (await playable.$get("medium")) as Medium;
    currentlyPlaying.chapter = await playable.$get("chapter");
  } else if (playable instanceof PlayQueue) {
    currentlyPlaying.playQueue = playable;
    currentlyPlaying.medium = (await playable.$get("medium")) as Medium;
    currentlyPlaying.chapter = await playable.$get("chapter");
  }

  const { startTime, endTime } = currentlyPlaying.chapter || {
    startTime: 0,
    endTime: 0,
  };

  if (currentlyPlaying.medium && endTime)
    mediaPlayer.play(currentlyPlaying.medium.url, startTime, endTime);
  else if (currentlyPlaying.medium)
    mediaPlayer.play(currentlyPlaying.medium.url);
}

export async function playNextPlaylistable() {
  if (!currentlyPlaying.playlistable) return;

  const lastOrder = await Playlistable.max("order", {
    where: { playlistId: currentlyPlaying.playlistable.playlistId },
  });
  const playlistable = await Playlistable.findOne({
    where: {
      playlistId: currentlyPlaying.playlistable.playlistId,
      ...(currentlyPlaying.playlistable.order != lastOrder && {
        order: { [Op.gt]: currentlyPlaying.playlistable.order },
      }),
    },
    order: [["order", "ASC"]],
  });

  playStatus.isLastOne = lastOrder == playlistable?.order;

  await play(playlistable);
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

  playStatus.isLastOne = lastOrder == queued?.order;

  await play(queued);
}

export async function playNextMedium() {
  const oldest = await Medium.findOne({ order: [["createdAt", "ASC"]] });
  const medium = await Medium.findOne({
    where: {
      ...(currentlyPlaying.medium &&
        currentlyPlaying.medium.id != oldest?.id && {
          createdAt: { [Op.lte]: currentlyPlaying.medium.createdAt },
          id: { [Op.ne]: currentlyPlaying.medium.id },
        }),
    },
    order: [["createdAt", "DESC"]],
  });

  playStatus.isLastOne = oldest?.id == medium?.id;

  await play(medium);
}

export async function playNextRandom() {
  let playable: Medium | Playlistable | PlayQueue | null;

  if (currentlyPlaying.playlistable)
    playable = await Playlistable.findOne({
      where: { playlistId: currentlyPlaying.playlist?.id },
      order: literal("random()"),
    });
  else if (currentlyPlaying.playQueue)
    playable = await PlayQueue.findOne({
      order: literal("random()"),
    });
  else
    playable = await Medium.findOne({
      order: literal("random()"),
    });

  await play(playable);
}
