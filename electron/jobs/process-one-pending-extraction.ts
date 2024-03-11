import { join } from "path";
import { Op } from "sequelize";
import { Worker } from "worker_threads";
import Extraction from "../../database/models/extraction";
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
