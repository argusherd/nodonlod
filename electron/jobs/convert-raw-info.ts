import dayjs from "dayjs";
import Chapter from "../../database/models/chapters";
import Playable from "../../database/models/playable";
import PlayablePlaylist from "../../database/models/playable-playlist";
import Playlist from "../../database/models/playlist";
import Uploader from "../../database/models/uploader";
import {
  RawPlayable,
  RawPlaylist,
  SubRawPlayable,
} from "../../src/raw-info-extractor";

export default async function convertRawInfo(
  rawInfo: RawPlayable | RawPlaylist,
) {
  if (rawInfo._type === "video") {
    await createPlayable(rawInfo);
    return;
  }

  const firstItem = rawInfo.entries.at(0);

  if (!firstItem) return;

  if ("_type" in firstItem) {
    for (const childRawPlaylist of rawInfo.entries) {
      await convertRawInfo(childRawPlaylist as RawPlaylist);
    }

    return;
  }

  const playlist = await createPlaylist(rawInfo);

  const playables = await Promise.all(
    rawInfo.entries.map((subRawPlayable) =>
      createPlayable(subRawPlayable as SubRawPlayable),
    ),
  );

  await createAssociation(playlist, playables, rawInfo.requested_entries);
}

async function createPlayable(
  rawInfo: RawPlayable | SubRawPlayable,
): Promise<Playable> {
  let playable = await Playable.findOne({
    where: { url: rawInfo.webpage_url },
  });

  if (playable) {
    for (const {
      start_time: startTime,
      end_time: endTime,
      title,
    } of rawInfo.chapters ?? []) {
      await createChapter({ startTime, title, endTime }, playable as Playable);
    }

    return await playable.update({
      duration: rawInfo.duration,
    });
  }

  const uploader = await createUploader(rawInfo);

  playable = await Playable.create({
    uploaderId: uploader?.id,
    url: rawInfo.webpage_url,
    resourceId: rawInfo.id,
    domain: rawInfo.webpage_url_domain,
    title: rawInfo.title,
    duration: rawInfo.duration,
    description: rawInfo.description,
    thumbnail: rawInfo.thumbnail,
    ageLimit: rawInfo.age_limit,
    uploadDate: rawInfo.upload_date
      ? dayjs(rawInfo.upload_date).toDate()
      : undefined,
  });

  for (const {
    start_time: startTime,
    end_time: endTime,
    title,
  } of rawInfo.chapters ?? []) {
    await createChapter({ startTime, title, endTime }, playable as Playable);
  }

  return playable;
}

async function createUploader(rawInfo: RawPlayable | SubRawPlayable) {
  const url = rawInfo.channel_url ?? rawInfo.uploader_url;
  const name = rawInfo.channel ?? rawInfo.uploader ?? "";

  if (!url) return;

  const uploader = await Uploader.findOne({ where: { url } });

  if (uploader) {
    return await uploader.update({ name });
  }

  return await Uploader.create({ url, name });
}

async function createChapter(
  {
    startTime,
    endTime,
    title,
  }: { startTime: number; endTime: number; title: string },
  playable: Playable,
) {
  const chapter = await Chapter.findOne({
    where: { playableId: playable.id, startTime, endTime },
  });

  if (!chapter)
    await Chapter.create({
      playableId: playable.id,
      startTime,
      endTime,
      title,
    });
}

async function createPlaylist(rawInfo: RawPlaylist): Promise<Playlist> {
  let playlist = await Playlist.findOne({
    where: { url: rawInfo.webpage_url },
  });

  if (!playlist) {
    playlist = await Playlist.create({
      title: rawInfo.title || rawInfo.id,
      url: rawInfo.webpage_url,
      resourceId: rawInfo.id,
      domain: rawInfo.webpage_url_domain,
      thumbnail: rawInfo.thumbnails && rawInfo.thumbnails[0]?.url,
      description: rawInfo.description,
    });
  }

  return playlist;
}

async function createAssociation(
  playlist: Playlist,
  playables: Playable[],
  orders: number[] = [],
) {
  await PlayablePlaylist.bulkCreate(
    playables.map((playable, idx) => ({
      playableId: playable.id,
      playlistId: playlist.id,
      order: orders.at(idx),
    })),
    {
      conflictAttributes: ["playableId", "playlistId"],
      updateOnDuplicate: ["order", "updatedAt"],
    },
  );
}
