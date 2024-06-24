import Medium from "@/database/models/medium";
import PlayQueue from "@/database/models/play-queue";
import wss from "@/routes/websocket";
import { createServer } from "http";
import { WebSocket } from "ws";
import { createChapter, createMedium } from "../setup/create-model";

describe("The websocket server", () => {
  const httpServer = createServer().on("upgrade", wss.handleUpgrade);
  httpServer.listen(6869);
  const client = new WebSocket("ws://localhost:6869");

  beforeEach(() => {
    wss.removeAllListeners("play-next");
    client.removeAllListeners();
  });

  afterAll(() => {
    client.close();
    httpServer.close();
  });

  it("can broadcast the media information", () => {
    client.on("message", (data) => {
      expect(data.toString()).toContain(
        "Rick Astley - Never Gonna Give You Up",
      );
    });

    wss.nowPlaying({ title: "Rick Astley - Never Gonna Give You Up" });
  });

  it("can broadcast the media information with chapter", () => {
    client.on("message", (data) => {
      const res = data.toString();
      expect(res).toContain("Rick Astley - Never Gonna Give You Up");
      expect(res).toContain("foo");
      expect(res).toContain("666");
      expect(res).toContain("777");
    });

    wss.nowPlaying({
      title: "Rick Astley - Never Gonna Give You Up",
      chapter: "foo",
      startTime: 666,
      endTime: 777,
    });
  });

  it("can broadcast the media duration and display it in the progress bar and the duration tag", () => {
    client.on("message", (data) => {
      expect(data.toString()).toContain('id="progress-bar"');
      expect(data.toString()).toContain("duration: 123");
      expect(data.toString()).toContain('<span id="duration">2:03</span>');
    });

    wss.mediaStart(123);
  });

  it("caches the media info to broadcast the progress bar later", () => {
    client.on("message", (data) => {
      if (data.toString().includes('id="player"')) return;

      expect(data.toString()).toContain('id="progress-bar"');
      expect(data.toString()).toContain("startTime: 50");
      expect(data.toString()).toContain("endTime: 90");
    });

    wss.nowPlaying({
      title: "Rick Astley - Never Gonna Give You Up",
      chapter: "foo",
      startTime: 50,
      endTime: 90,
    });

    wss.mediaStart(212);
  });

  it("also broadcasts a pause button when broadcasting the media duration", () => {
    client.on("message", (data) => {
      expect(data.toString()).toContain('id="play-btn"');
      expect(data.toString()).toContain("/player/pause");
    });

    wss.mediaStart(123);
  });

  it("can broadcast that there is new media in the play queue about to be played", async () => {
    client.on("message", (data) => {
      expect(data.toString()).toContain("Together forever");
    });

    const medium = await createMedium({
      title: "Together forever",
    });

    await PlayQueue.create({ mediumId: medium.id });

    await wss.playNext();
  });

  it("emits a signal instructing to play the media from the URL", async () => {
    wss.on("play-next", (url) => {
      expect(url).toEqual("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    });

    const medium = await createMedium({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });

    await PlayQueue.create({ mediumId: medium.id });

    await wss.playNext();
  });

  it("removes the front item of the play queue when instructing the server to play the next item", async () => {
    const medium = await createMedium();

    await PlayQueue.create({ mediumId: medium.id });

    await wss.playNext();

    expect(await PlayQueue.count()).toEqual(0);
  });

  it("plays the next items in the play queue based on their order", async () => {
    const goFirst = await createMedium();
    const goSecond = await createMedium();

    client.on("message", (data) => {
      expect(data.toString()).toContain(goFirst.title);
    });

    await PlayQueue.create({ mediumId: goSecond.id, order: 15 });
    await PlayQueue.create({ mediumId: goFirst.id, order: 14 });

    await wss.playNext();
  });

  it("can broadcast media information along with the chapter when instructing the server to play the next item in the play queue", async () => {
    client.on("message", (data) => {
      const res = data.toString();
      expect(res).toContain("Rick Astley - Never Gonna Give You Up");
      expect(res).toContain("foo");
      expect(res).toContain("666");
      expect(res).toContain("777");
    });

    const medium = await createMedium({
      title: "Rick Astley - Never Gonna Give You Up",
    });

    const chapter = await createChapter({
      mediumId: medium.id,
      startTime: 666,
      endTime: 777,
      title: "foo",
    });

    await PlayQueue.create({ mediumId: medium.id, chapterId: chapter.id });

    await wss.playNext();
  });

  it("emits a signal to play the media within a specific range from the URL when instructed to play the next chapter in the play queue", async () => {
    wss.on("play-next", (url, startTime, endTime) => {
      expect(url).toEqual("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(startTime).toEqual(10);
      expect(endTime).toEqual(30);
    });

    const medium = await createMedium({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });

    const chapter = await createChapter({
      mediumId: medium.id,
      startTime: 10,
      endTime: 30,
      title: "foo",
    });

    await PlayQueue.create({ mediumId: medium.id, chapterId: chapter.id });

    await wss.playNext();
  });

  it("can broadcast the current play time of the media", () => {
    client.on("message", (data) => {
      expect(data.toString()).toContain(JSON.stringify({ currentTime: 30 }));
    });

    wss.currentTime(30);
  });

  it("can broadcast the latest play queue", async () => {
    const chapter = await createChapter();
    const medium = (await chapter.$get("medium")) as Medium;

    client.on("message", (data) => {
      expect(data.toString()).toContain(medium.title);
      expect(data.toString()).toContain(chapter.title);
    });

    await PlayQueue.create({ mediumId: medium.id, chapterId: chapter.id });

    await wss.latestPlayQueue();
  });

  it("broadcasts the latest play queue items based on their order", async () => {
    const medium1 = await createMedium();
    const medium2 = await createMedium();

    client.on("message", (data) => {
      const displayOrder = new RegExp(`.*${medium2.title}.*${medium1.title}.*`);

      expect(data.toString().match(displayOrder)).not.toBeNull();
    });

    await PlayQueue.create({ mediumId: medium1.id, order: 15 });
    await PlayQueue.create({ mediumId: medium2.id, order: 14 });

    await wss.latestPlayQueue();
  });

  it("can broadcast the media is stopped", () => {
    client.on("message", (data) => {
      expect(data.toString()).toContain('id="play-btn"');
      expect(data.toString()).toContain("/player/replay");
    });

    wss.mediaStop();
  });
});
