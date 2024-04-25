import dayjs from "dayjs";
import Playable from "../../database/models/playable";
import Playlist from "../../database/models/playlist";
import { RawPlayable, RawPlaylist } from "../../src/raw-info-extractor";

export default async function convertRawInfo(
  rawInfo: RawPlayable | RawPlaylist,
) {
  if (rawInfo._type === "video") {
    await createPlayable(rawInfo);
    return;
  }

  if (rawInfo.entries.at(0)?._type === "video") {
    const playlist = await createPlaylist(rawInfo);

    const playables = rawInfo.entries.map((rawPlayable) =>
      createPlayable(rawPlayable as RawPlayable),
    );

    await playlist.$add("playable", await Promise.all(playables));
  } else {
    for (const childRawPlaylist of rawInfo.entries) {
      await convertRawInfo(childRawPlaylist);
    }
  }
}

async function createPlayable(rawInfo: RawPlayable): Promise<Playable> {
  const playable = await Playable.findOne({
    where: {
      url: rawInfo.webpage_url,
      resourceId: rawInfo.id,
    },
  });

  if (playable) {
    return await playable.update({
      duration: rawInfo.duration,
    });
  } else {
    return await Playable.create({
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
  }
}

async function createPlaylist(rawInfo: RawPlaylist): Promise<Playlist> {
  let playlist = await Playlist.findOne({
    where: {
      url: rawInfo.webpage_url,
      resourceId: rawInfo.id,
    },
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
