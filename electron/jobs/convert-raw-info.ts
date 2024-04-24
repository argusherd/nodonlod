import dayjs from "dayjs";
import Playable, {
  PlayableCreationAttributes,
} from "../../database/models/playable";
import Playlist, {
  PlaylistCreationAttributes,
} from "../../database/models/playlist";
import { RawPlayable, RawPlaylist } from "../../src/raw-info-extractor";

export default async function convertRawInfo(
  rawInfo: RawPlayable | RawPlaylist,
) {
  if (rawInfo._type === "video") {
    await createPlayable(rawInfo);
  }

  if (rawInfo._type === "playlist") {
    if (rawInfo.entries.at(0)?._type === "video") {
      await createPlaylist(rawInfo);
    }

    for (const nestedInfo of rawInfo.entries) {
      await convertRawInfo(nestedInfo);
    }
  }
}

async function createPlayable(rawInfo: RawPlayable) {
  await Playable.upsert(
    {
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
    },
    {
      fields: ["duration"],
      conflictFields: [
        "resource_id",
      ] as unknown as (keyof PlayableCreationAttributes)[],
    },
  );
}

async function createPlaylist(rawInfo: RawPlaylist) {
  await Playlist.upsert(
    {
      title: rawInfo.title || rawInfo.id,
      url: rawInfo.webpage_url,
      resourceId: rawInfo.id,
      domain: rawInfo.webpage_url_domain,
      thumbnail: rawInfo.thumbnails && rawInfo.thumbnails[0]?.url,
      description: rawInfo.description,
    },
    {
      fields: [],
      conflictFields: [
        "resource_id",
      ] as unknown as (keyof PlaylistCreationAttributes)[],
    },
  );
}
