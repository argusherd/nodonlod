import dayjs from "dayjs";
import { IncomingMessage } from "http";
import { join } from "path";
import { renderFile } from "pug";
import internal from "stream";
import { WebSocketServer } from "ws";
import Chapter from "../database/models/chapter";
import PlayQueue from "../database/models/play-queue";
import Playable from "../database/models/playable";
import neatDuration from "../src/neat-duration";
import { i18n } from "./middlewares/i18n";

interface MediaInfo {
  title: string;
  chapter?: string;
  startTime?: number;
  endTime?: number;
}

interface WsServer extends WebSocketServer {
  emit(
    event: "play-next",
    url: string,
    startTime?: number,
    endTime?: number,
  ): boolean;

  on(
    event: "play-next",
    listener: (url: string, startTime?: number, endTime?: number) => void,
  ): void;
  on(event: string, listener: (...args: any[]) => void): this;
}

export interface WSS {
  handleUpgrade: (
    request: IncomingMessage,
    socket: internal.Duplex,
    head: Buffer,
  ) => void;
  nowPlaying: (mediaInfo: MediaInfo) => void;
  mediaStart: (duration: number) => void;
  mediaStop: () => void;
  playNext: () => Promise<void>;
  currentTime: (currentTime: number) => void;
  latestPlayQueue: () => Promise<void>;
  on: Pick<WsServer, "on">["on"];
  removeAllListeners: (event: "play-next") => void;
}

dayjs.extend(neatDuration);

const wsServer: WsServer = new WebSocketServer({ noServer: true });
const relativePath =
  process.env.NODE_ENV === "test" ? "../views" : "../../views";
const render = (filename: string, params?: object) =>
  renderFile(join(__dirname, relativePath, filename), {
    ...params,
    dayjs,
    __: i18n.__,
  });

function playChapter(playable: Playable, chapter: Chapter) {
  const mediaInfo: MediaInfo = { title: playable.title };
  const { title: chTitle, startTime, endTime } = chapter;

  mediaInfo.chapter = chTitle;
  mediaInfo.startTime = startTime;
  mediaInfo.endTime = endTime;

  wsServer.emit("play-next", playable.url, startTime, endTime);
  wss.nowPlaying(mediaInfo);
}

let cachedInfo: MediaInfo;

const wss: WSS = {
  handleUpgrade: (
    request: IncomingMessage,
    socket: internal.Duplex,
    head: Buffer,
  ) =>
    wsServer.handleUpgrade(request, socket, head, (ws) => {
      ws.emit("connection", ws, request);
    }),
  nowPlaying: (mediaInfo: MediaInfo) =>
    wsServer.clients.forEach((ws) => {
      cachedInfo = mediaInfo;
      ws.send(render("player/_player.pug", { ...mediaInfo }));
    }),
  mediaStart: (duration: number) =>
    wsServer.clients.forEach((ws) =>
      ws.send(
        render("player/_progress-bar.pug", { ...cachedInfo, duration }) +
          render("player/_duration.pug", { duration }) +
          render("player/_pause.pug"),
      ),
    ),
  mediaStop: () =>
    wsServer.clients.forEach((ws) => ws.send(render("player/_replay.pug"))),
  playNext: async () => {
    const playQueue = await PlayQueue.findOne({
      include: [Playable, Chapter],
      order: [["order", "ASC"]],
    });

    if (!playQueue) return;

    const { playable, chapter } = playQueue;

    await playQueue.destroy();

    if (chapter) playChapter(playable, chapter);
    else {
      wsServer.emit("play-next", playable.url);
      wss.nowPlaying({ title: playable.title });
    }
  },
  currentTime: (currentTime) =>
    wsServer.clients.forEach((ws) => ws.send(JSON.stringify({ currentTime }))),
  latestPlayQueue: async () => {
    const items = await PlayQueue.findAll({
      include: [Playable, Chapter],
      order: [["order", "ASC"]],
    });

    wsServer.clients.forEach(async (ws) =>
      ws.send(render("play-queues/index.pug", { items })),
    );
  },
  on: (event, listener) => wsServer.on(event, listener),
  removeAllListeners: (event) => wsServer.removeAllListeners(event),
};

export default wss;
