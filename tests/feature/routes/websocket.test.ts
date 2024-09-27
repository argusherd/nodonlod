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

  it("can broadcast the duration of the media", () => {
    client.on("message", (data) => {
      expect(data.toString()).toContain(JSON.stringify({ duration: 123 }));
    });

    wss.duration(123);
  });

  it("notifies clients that a custom event should be triggered", () => {
    client.on("message", (data) => {
      expect(data.toString()).toContain(
        JSON.stringify({ event: "refresh-list" }),
      );
    });

    wss.dispatch("refresh-list");
  });
});
