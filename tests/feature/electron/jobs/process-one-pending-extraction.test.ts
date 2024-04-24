import Extraction from "@/database/models/extraction";
import convertRawInfo from "@/electron/jobs/convert-raw-info";
import processOnePendingExtraction from "@/electron/jobs/process-one-pending-extraction";
import { resolve } from "path";
import { Worker } from "worker_threads";
import { createRawPlayable } from "../../setup/create-raw-info";

jest.mock("worker_threads");
jest.mock("@/electron/jobs/convert-raw-info", () => jest.fn());

describe("The job involves processing a pending extraction", () => {
  const videoURL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

  it("skips the current job if there is still an extraction process in progress", async () => {
    await Extraction.create({ url: videoURL, isProcessing: true });

    await processOnePendingExtraction();

    expect(Worker).not.toHaveBeenCalled();
  });

  it("passes a script path and an URL to the worker", async () => {
    await Extraction.create({ url: videoURL });

    await processOnePendingExtraction();

    expect(Worker).toHaveBeenCalledWith(resolve("src/raw-info-extractor"), {
      workerData: videoURL,
    });
  });

  it("uses the URL from the extraction and preserves the raw info", async () => {
    const rawInfo = createRawPlayable();

    jest.mocked(Worker.prototype).on.mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "message") listener(rawInfo);
      }),
    );

    const extraction = await Extraction.create({ url: videoURL });

    await processOnePendingExtraction();

    await extraction.reload();

    expect(extraction.content).toEqual(rawInfo);
    expect(extraction.isProcessing).toBeFalsy();
  });

  it("preserves the error message if something goes wrong during the extraction process", async () => {
    jest.mocked(Worker.prototype).on.mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "error") listener(new Error("media not found"));
      }),
    );

    const extraction = await Extraction.create({ url: videoURL });

    await processOnePendingExtraction();

    await extraction.reload();

    expect(extraction.content).toBeNull();
    expect(extraction.error).toEqual("media not found");
    expect(extraction.isProcessing).toBeFalsy();
  });

  it("does not reprocess extractions that have already been processed", async () => {
    await Extraction.create({
      url: videoURL,
      content: JSON.stringify(createRawPlayable()),
    });

    await Extraction.create({
      url: videoURL,
      error: "media not found",
    });

    await processOnePendingExtraction();

    expect(Worker).not.toHaveBeenCalled();
  });

  it("calls the function to convert the raw info to playables/playlists", async () => {
    const rawInfo = createRawPlayable();

    jest.mocked(Worker.prototype).on.mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "message") listener(rawInfo);
      }),
    );

    await Extraction.create({ url: videoURL });

    await processOnePendingExtraction();

    expect(convertRawInfo).toHaveBeenCalledWith(rawInfo);
  });
});
