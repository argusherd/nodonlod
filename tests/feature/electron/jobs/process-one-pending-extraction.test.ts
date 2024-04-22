import Extraction from "@/database/models/extraction";
import Playable from "@/database/models/playable";
import Playlist from "@/database/models/playlist";
import processOnePendingExtraction from "@/electron/jobs/process-one-pending-extraction";
import dayjs from "dayjs";
import { resolve } from "path";
import { Worker } from "worker_threads";
import { createPlayable, createPlaylist } from "../../setup/create-playable";
import {
  createRawPlayable,
  createRawPlaylist,
} from "../../setup/create-raw-info";

jest.mock("worker_threads");

describe("The job involves processing a pending extraction", () => {
  const videoURL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  const playlistURL =
    "https://www.youtube.com/playlist?list=OLAK5uy_l4pFyLY9N1YSGpxT0EEq8Whc8OyhpWsm8";

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

  it("creates a playable based on the raw-playable content", async () => {
    const rawPlayable = createRawPlayable();

    jest.mocked(Worker.prototype).on.mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "message") listener(rawPlayable);
      }),
    );

    await Extraction.create({ url: videoURL });
    await processOnePendingExtraction();
    await new Promise(process.nextTick);

    expect(await Playable.count()).toEqual(1);

    const playable = await Playable.findOne();

    expect(playable?.url).toEqual(rawPlayable.webpage_url);
    expect(playable?.resourceId).toEqual(rawPlayable.id);
    expect(playable?.domain).toEqual(rawPlayable.webpage_url_domain);
    expect(playable?.title).toEqual(rawPlayable.title);
    expect(playable?.duration).toEqual(rawPlayable.duration);
    expect(playable?.description).toEqual(rawPlayable.description);
    expect(playable?.thumbnail).toEqual(rawPlayable.thumbnail);
    expect(playable?.ageLimit).toEqual(rawPlayable.age_limit);
    expect(playable?.uploadDate).toEqual(
      dayjs(rawPlayable.upload_date).toDate(),
    );
  });

  it("creates a playlist and relatived playables based on the raw-playlist content", async () => {
    const rawPlayable = createRawPlayable();
    const rawPlaylist = createRawPlaylist({ entries: [rawPlayable] });

    jest.mocked(Worker.prototype).on.mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "message") listener(rawPlaylist);
      }),
    );

    await Extraction.create({ url: playlistURL });
    await processOnePendingExtraction();
    await new Promise(process.nextTick);

    expect(await Playlist.count()).toEqual(1);
    expect(await Playable.count()).toEqual(1);

    const playable = await Playable.findOne();
    const playlist = await Playlist.findOne();

    expect(playable?.resourceId).toEqual(rawPlayable.id);

    expect(playlist?.title).toEqual(rawPlaylist.title);
    expect(playlist?.url).toEqual(rawPlaylist.webpage_url);
    expect(playlist?.resourceId).toEqual(rawPlaylist.id);
    expect(playlist?.domain).toEqual(rawPlaylist.webpage_url_domain);
    expect(playlist?.thumbnail).toEqual(
      rawPlaylist.thumbnails && rawPlaylist.thumbnails[0]?.url,
    );
    expect(playlist?.description).toEqual(rawPlaylist.description);
  });

  it("creates multiple playlists based on the nested raw-playlist content", async () => {
    const rawPlayable = createRawPlayable();
    const childRawPlaylist1 = createRawPlaylist({ entries: [rawPlayable] });
    const childRawPlaylist2 = createRawPlaylist({ entries: [rawPlayable] });
    const parentRawPlaylist = createRawPlaylist({
      entries: [childRawPlaylist1, childRawPlaylist2],
    });

    jest.mocked(Worker.prototype).on.mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "message") listener(parentRawPlaylist);
      }),
    );

    await Extraction.create({ url: playlistURL });
    await processOnePendingExtraction();
    await new Promise(process.nextTick);

    expect(await Playlist.count()).toEqual(1);

    await new Promise(process.nextTick);

    expect(await Playlist.count()).toEqual(2);
    expect(await Playable.count()).toEqual(1);

    const playable = await Playable.findOne();
    const playlist1 = await Playlist.findOne();
    const playlist2 = await Playlist.findOne({ offset: 1 });

    expect(playable?.resourceId).toEqual(rawPlayable.id);
    expect(playlist1?.resourceId).toEqual(childRawPlaylist1.id);
    expect(playlist2?.resourceId).toEqual(childRawPlaylist2.id);
  });

  it("does not create a playlist from the top level of a nested raw-playlist", async () => {
    const rawPlayable = createRawPlayable();
    const childRawPlaylist = createRawPlaylist({ entries: [rawPlayable] });
    const parentPlaylist = createRawPlaylist({ entries: [childRawPlaylist] });

    jest.mocked(Worker.prototype).on.mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "message") listener(parentPlaylist);
      }),
    );

    await Extraction.create({ url: playlistURL });
    await processOnePendingExtraction();
    await new Promise(process.nextTick);

    const playlist = await Playlist.findOne();

    expect(await Playlist.count()).toEqual(1);
    expect(playlist?.resourceId).toEqual(childRawPlaylist.id);
  });

  it("does not create a playlist from a raw-playlist with an empty entries property", async () => {
    const nestedRawPlaylist = createRawPlaylist({ entries: [] });
    const rawPlaylist = createRawPlaylist({ entries: [nestedRawPlaylist] });

    jest.mocked(Worker.prototype).on.mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "message") listener(rawPlaylist);
      }),
    );

    await Extraction.create({ url: playlistURL });
    await processOnePendingExtraction();
    await new Promise(process.nextTick);

    expect(await Playlist.count()).toEqual(0);
  });

  it("does not create a same playable twice", async () => {
    const rawPlayable = createRawPlayable();

    jest.mocked(Worker.prototype).on.mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "message") listener(rawPlayable);
      }),
    );

    await Extraction.create({ url: videoURL });
    await processOnePendingExtraction();
    await Extraction.create({ url: videoURL });
    await processOnePendingExtraction();
    await new Promise(process.nextTick);

    expect(await Playable.count()).toEqual(1);
  });

  it("does not create a same playlist twice", async () => {
    const rawPlayable = createRawPlayable();
    const rawPlaylist = createRawPlaylist({ entries: [rawPlayable] });

    jest.mocked(Worker.prototype).on.mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "message") listener(rawPlaylist);
      }),
    );

    await Extraction.create({ url: playlistURL });
    await processOnePendingExtraction();
    await Extraction.create({ url: playlistURL });
    await processOnePendingExtraction();
    await new Promise(process.nextTick);

    expect(await Playlist.count()).toEqual(1);
    expect(await Playable.count()).toEqual(1);
  });

  it("does not overwrite the existing playable's title, description, thumbnail, or age limit but duration", async () => {
    const rawPlayable = createRawPlayable();

    jest.mocked(Worker.prototype).on.mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "message") listener(rawPlayable);
      }),
    );

    const playable = await createPlayable({
      resourceId: rawPlayable.id,
      title: "My title",
      description: "My description",
      thumbnail: "https://my-thumbnail.com/foo.jpg",
      ageLimit: 50,
      duration: 666,
    });

    await Extraction.create({ url: videoURL });
    await processOnePendingExtraction();
    await new Promise(process.nextTick);

    await playable.reload();

    expect(playable.title).toEqual("My title");
    expect(playable.description).toEqual("My description");
    expect(playable.thumbnail).toEqual("https://my-thumbnail.com/foo.jpg");
    expect(playable.ageLimit).toEqual(50);
    expect(playable.duration).toEqual(rawPlayable.duration);
  });

  it("does not overwrite the existing playlist's title, description, or thumbnail", async () => {
    const rawPlayable = createRawPlayable();
    const rawPlaylist = createRawPlaylist({ entries: [rawPlayable] });

    jest.mocked(Worker.prototype).on.mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "message") listener(rawPlaylist);
      }),
    );

    const playlist = await createPlaylist({
      resourceId: rawPlaylist.id,
      title: "My title",
      description: "My description",
      thumbnail: "https://my-thumbnail.com/foo.jpg",
    });

    await Extraction.create({ url: playlistURL });
    await processOnePendingExtraction();
    await new Promise(process.nextTick);

    await playlist.reload();

    expect(playlist.title).toEqual("My title");
    expect(playlist.description).toEqual("My description");
    expect(playlist.thumbnail).toEqual("https://my-thumbnail.com/foo.jpg");
  });
});
