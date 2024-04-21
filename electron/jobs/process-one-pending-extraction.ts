import dayjs from "dayjs";
import { join } from "path";
import { Op } from "sequelize";
import { Worker } from "worker_threads";
import Extraction from "../../database/models/extraction";
import Playable, {
  PlayableCreationAttributes,
} from "../../database/models/playable";
import Playlist, {
  PlaylistCreationAttributes,
} from "../../database/models/playlist";
import { RawPlayable, RawPlaylist } from "../../src/raw-info-extractor";

export default async function processOnePendingExtraction() {
  if (await isStillProcessing()) return;

  const extraction = await findUnprocessed();

  if (!extraction) return;

  await markAsProcessing(extraction);

  const worker = new Worker(join(__dirname, "../../src/raw-info-extractor"), {
    workerData: extraction.url,
  });

  worker.on("message", async (rawInfo: RawPlayable | RawPlaylist) => {
    await extraction.update({
      isProcessing: false,
      content: JSON.stringify(rawInfo),
    });

    await convertRawInfo(rawInfo);
  });

  worker.on("error", async (error) => {
    await extraction.update({
      isProcessing: false,
      error: error.message,
    });
  });
}

async function isStillProcessing() {
  return await Extraction.count({
    where: { isProcessing: true },
  });
}

async function findUnprocessed() {
  return await Extraction.findOne({
    where: {
      [Op.and]: [{ content: null }, { error: null }],
    },
  });
}

async function markAsProcessing(extraction: Extraction) {
  await extraction.update({ isProcessing: true });
}

async function convertRawInfo(rawInfo: RawPlayable | RawPlaylist) {
  if (rawInfo._type === "video") {
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

  if (rawInfo._type === "playlist") {
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

    for (const nestedInfo of rawInfo.entries) {
      await convertRawInfo(nestedInfo);
    }
  }
}
