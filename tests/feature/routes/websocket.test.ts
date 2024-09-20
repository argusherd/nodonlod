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

  it("can broadcast the media information", async () => {
    const medium = await createMedium();

    client.on("message", (data) => {
      expect(data.toString()).toContain(medium.title);
    });

    wss.nowPlaying(medium);
  });

  it("can broadcast the media information with chapter", async () => {
    const medium = await createMedium();
    const chapter = await createChapter({ mediumId: medium.id });

    client.on("message", (data) => {
      const res = data.toString();
      expect(res).toContain(medium.title);
      expect(res).toContain(chapter.title);
    });

    wss.nowPlaying(medium, chapter);
  });

  it("can broadcast the media duration and display it in the progress bar and the duration tag", () => {
    client.on("message", (data) => {
      expect(data.toString()).toContain('id="progress-bar"');
      expect(data.toString()).toContain("duration: 123");
      expect(data.toString()).toContain('<span id="duration">2:03</span>');
    });

    wss.mediaStart(123);
  });

  it("caches the media info to broadcast the progress bar later", async () => {
    const medium = await createMedium();
    const chapter = await createChapter({
      mediumId: medium.id,
      startTime: 50,
      endTime: 90,
    });

    client.on("message", (data) => {
      if (data.toString().includes('id="player"')) return;

      expect(data.toString()).toContain('id="progress-bar"');
      expect(data.toString()).toContain("startTime: 50");
      expect(data.toString()).toContain("endTime: 90");
    });

    wss.nowPlaying(medium, chapter);
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

  it("emits a signal instructing the server to play the media from the URL when requesting to play the next item", async () => {
    wss.on("play-next", (url) => {
      expect(url).toEqual("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    });

    const medium = await createMedium({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });

    await PlayQueue.create({ mediumId: medium.id });

    await wss.playNext();
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

  it("removes the played item from the play queue and reorders the remaining items when instructing the server to play the next item", async () => {
    const medium = await createMedium();

    await PlayQueue.create({ mediumId: medium.id, order: 1 });
    const remaining = await PlayQueue.create({ mediumId: medium.id, order: 2 });

    wss.nowPlaying(medium);

    await wss.playNext();

    expect(await PlayQueue.count()).toEqual(1);

    await remaining.reload();

    expect(remaining.order).toEqual(1);
  });

  it("only reorders the remaining items whose order is greater than the played item", async () => {
    const playFirst = await createMedium();
    const remaining = await createMedium();

    await PlayQueue.create({ mediumId: remaining.id, order: 1 });
    const untouched = await PlayQueue.create({
      mediumId: remaining.id,
      order: 2,
    });
    await PlayQueue.create({ mediumId: playFirst.id, order: 3 });
    const reordered = await PlayQueue.create({
      mediumId: remaining.id,
      order: 4,
    });

    wss.nowPlaying(playFirst);

    await wss.playNext();

    await untouched.reload();
    await reordered.reload();

    expect(untouched.order).toEqual(2);
    expect(reordered.order).toEqual(3);
  });

  it("distinguishes the same medium with different chapters when removing the played item from the play queue", async () => {
    const medium = await createMedium();
    const chapter1 = await createChapter();
    const chapter2 = await createChapter();

    await PlayQueue.create({
      mediumId: medium.id,
      chapterId: chapter1.id,
      order: 1,
    });
    await PlayQueue.create({
      mediumId: medium.id,
      chapterId: chapter2.id,
      order: 2,
    });

    wss.nowPlaying(medium, chapter2);

    await wss.playNext();

    const playQueue = await PlayQueue.findOne();

    expect(playQueue?.chapterId).toEqual(chapter1.id);
  });

  it("can broadcast media information along with the chapter when instructing the server to play the next item in the play queue", async () => {
    client.on("message", (data) => {
      const res = data.toString();
      expect(res).toContain("Rick Astley - Never Gonna Give You Up");
      expect(res).toContain("foo");
    });

    const medium = await createMedium({
      title: "Rick Astley - Never Gonna Give You Up",
    });

    const chapter = await createChapter({
      mediumId: medium.id,
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

  it("notifies clients that a custom event should be triggered", () => {
    client.on("message", (data) => {
      expect(data.toString()).toContain(
        JSON.stringify({ event: "refresh-list" }),
      );
    });

    wss.dispatch("refresh-list");
  });

  it("can broadcast the media is stopped", () => {
    client.on("message", (data) => {
      expect(data.toString()).toContain('id="play-btn"');
      expect(data.toString()).toContain("/player/replay");
    });

    wss.mediaStop();
  });
});
