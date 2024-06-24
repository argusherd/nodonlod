import { join } from "path";
import { Op } from "sequelize";
import { Worker } from "worker_threads";
import Extraction from "../../database/models/extraction";
import RawInfoConverter from "../../src/raw-info-converter";
import { RawMedium, RawPlaylist } from "../../src/raw-info-extractor";

export default async function processOnePendingExtraction() {
  if (await isStillProcessing()) return;

  const extraction = await findUnprocessed();

  if (!extraction) return;

  await markAsProcessing(extraction);

  const perPage = 10;
  const startAt = (extraction.page - 1) * perPage + 1;
  const stopAt = extraction.page * perPage;

  const worker = new Worker(join(__dirname, "../../src/raw-info-extractor"), {
    workerData: { url: extraction.url, startAt, stopAt },
  });

  worker.on("message", async (rawInfo: RawMedium | RawPlaylist) => {
    const converter = new RawInfoConverter();

    if (extraction.isConvertible) await converter.convertAll(rawInfo);

    await extraction.update({
      isProcessing: false,
      content: JSON.stringify(rawInfo),
    });

    if (extraction.isContinuous && stillHasItems(rawInfo)) {
      await dispatchAnotherOne(extraction);
    }
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

async function dispatchAnotherOne(extraction: Extraction) {
  await Extraction.create({
    url: extraction.url,
    isContinuous: true,
    page: extraction.page + 1,
  });
}

function stillHasItems(rawInfo: RawMedium | RawPlaylist): boolean {
  if (rawInfo._type === "video") return false;

  const firstItem = rawInfo.entries.at(0);

  if (!firstItem) return false;

  if ("_type" in firstItem === false) return true;

  for (const childRawPlaylist of rawInfo.entries) {
    if (stillHasItems(childRawPlaylist as RawPlaylist)) return true;
  }

  return false;
}
