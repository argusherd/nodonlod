import Extraction from "@/database/models/extraction";
import processOnePendingExtraction from "@/electron/jobs/process-one-pending-extraction";
import RawInfoConverter from "@/src/raw-info-converter";
import { resolve } from "path";
import { Worker } from "worker_threads";
import {
  createRawMedium,
  createRawPlaylist,
  createSubRawMedium,
} from "../../setup/create-raw-info";

jest.mock("worker_threads");
jest.mock("@/src/raw-info-converter");

describe("The job involves processing a pending extraction", () => {
  const videoURL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  const playlistURL =
    "https://www.youtube.com/playlist?list=OLAK5uy_l4pFyLY9N1YSGpxT0EEq8Whc8OyhpWsm8";

  it("skips the current job if there is still an extraction process in progress", async () => {
    await Extraction.create({ url: videoURL, isProcessing: true });

    await processOnePendingExtraction();

    expect(Worker).not.toHaveBeenCalled();
  });

  it("passes a script path and workerData to the worker", async () => {
    await Extraction.create({ url: videoURL });

    await processOnePendingExtraction();

    expect(Worker).toHaveBeenCalledWith(resolve("src/raw-info-extractor"), {
      workerData: {
        url: videoURL,
        startAt: 1,
        stopAt: 10,
      },
    });
  });

  it("uses the URL from the extraction and preserves the raw info", async () => {
    const rawInfo = createRawMedium();

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
      content: JSON.stringify(createRawMedium()),
    });

    await Extraction.create({
      url: videoURL,
      error: "media not found",
    });

    await processOnePendingExtraction();

    expect(Worker).not.toHaveBeenCalled();
  });

  it("calls the function to convert the raw info to media/playlists", async () => {
    const mockedConvertAll = jest
      .spyOn(RawInfoConverter.prototype, "convertAll")
      .mockImplementation();

    const rawInfo = createRawMedium();

    jest.mocked(Worker.prototype).on.mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "message") listener(rawInfo);
      }),
    );

    await Extraction.create({ url: videoURL });

    await processOnePendingExtraction();

    expect(mockedConvertAll).toHaveBeenCalledWith(rawInfo);
  });

  it("dispatches another job if it's a continuous extraction", async () => {
    const subRawMedium = createSubRawMedium();
    const rawPlaylist = createRawPlaylist({ entries: [subRawMedium] });

    jest.mocked(Worker.prototype).on.mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "message") listener(rawPlaylist);
      }),
    );

    const extraction = await Extraction.create({
      url: playlistURL,
      isContinuous: true,
    });

    await processOnePendingExtraction();
    await new Promise(process.nextTick);

    expect(await Extraction.count()).toEqual(2);

    const newExtraction = await Extraction.findOne({ offset: 1 });

    expect(newExtraction?.url).toEqual(extraction.url);
    expect(newExtraction?.isContinuous).toBeTruthy();
    expect(newExtraction?.id).not.toEqual(extraction.id);
  });

  it("increases the page number by 1 based on the extraction when dispatching a new job", async () => {
    const subRawMedium = createSubRawMedium();
    const rawPlaylist = createRawPlaylist({ entries: [subRawMedium] });

    jest.mocked(Worker.prototype).on.mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "message") listener(rawPlaylist);
      }),
    );

    await Extraction.create({
      url: playlistURL,
      isContinuous: true,
      page: 5,
    });

    await processOnePendingExtraction();
    await new Promise(process.nextTick);

    expect(Worker).toHaveBeenCalledWith(resolve("src/raw-info-extractor"), {
      workerData: {
        url: playlistURL,
        startAt: 41,
        stopAt: 50,
      },
    });

    const newExtraction = await Extraction.findOne({ offset: 1 });

    expect(newExtraction?.page).toEqual(6);
  });

  it("only dispatches a new extraction when the raw-playlist entries property is not empty", async () => {
    const rawPlaylist = createRawPlaylist();

    jest.mocked(Worker.prototype).on.mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "message") listener(rawPlaylist);
      }),
    );

    await Extraction.create({ url: playlistURL, isContinuous: true });

    await processOnePendingExtraction();
    await new Promise(process.nextTick);

    expect(await Extraction.count()).toEqual(1);
  });

  it("only dispatches a new extraction when the child raw-playlist entries are not empty", async () => {
    const childRawPlaylist = createRawPlaylist();
    const rawPlaylist = createRawPlaylist({ entries: [childRawPlaylist] });

    jest.mocked(Worker.prototype).on.mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "message") listener(rawPlaylist);
      }),
    );

    await Extraction.create({ url: playlistURL, isContinuous: true });

    await processOnePendingExtraction();
    await new Promise(process.nextTick);

    expect(await Extraction.count()).toEqual(1);
  });

  it("does not dispatch a new extraction based on a raw-medium content", async () => {
    const rawMedium = createRawMedium();

    jest.mocked(Worker.prototype).on.mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "message") listener(rawMedium);
      }),
    );

    await Extraction.create({ url: playlistURL, isContinuous: true });

    await processOnePendingExtraction();
    await new Promise(process.nextTick);

    expect(await Extraction.count()).toEqual(1);
  });

  it("can disable the raw info to media/playlists conversion", async () => {
    const mockedConvertAll = jest
      .spyOn(RawInfoConverter.prototype, "convertAll")
      .mockImplementation();

    const rawMedium = createRawMedium();

    jest.mocked(Worker.prototype).on.mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "message") listener(rawMedium);
      }),
    );

    await Extraction.create({ url: playlistURL, isConvertible: false });
    await processOnePendingExtraction();

    expect(mockedConvertAll).not.toHaveBeenCalled();
  });
});
