import { IncomingMessage } from "http";
import { Op } from "sequelize";
import internal from "stream";
import { WebSocketServer } from "ws";
import Chapter from "../database/models/chapter";
import Medium from "../database/models/medium";
import PlayQueue from "../database/models/play-queue";
import render from "./pug";

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
  nowPlaying: (medium: Medium, chapter?: Chapter) => void;
  mediaStart: (duration: number) => void;
  mediaStop: () => void;
  playNext: () => Promise<void>;
  currentTime: (currentTime: number) => void;
  latestPlayQueue: () => Promise<void>;
  on: Pick<WsServer, "on">["on"];
  removeAllListeners: (event: "play-next") => void;
}

async function reorderRemaining() {
  const played = await PlayQueue.findOne({
    where: {
      mediumId: cachedMedium.id,
      ...(cachedChapter && { chapterId: cachedChapter?.id }),
    },
    order: [["order", "ASC"]],
  });

  if (!played) return;

  await played.destroy();

  await PlayQueue.decrement("order", {
    by: 1,
    where: { order: { [Op.gt]: played.order } },
  });
}

const wsServer: WsServer = new WebSocketServer({ noServer: true });

let cachedMedium: Medium;
let cachedChapter: Chapter | undefined;

const wss: WSS = {
  handleUpgrade: (
    request: IncomingMessage,
    socket: internal.Duplex,
    head: Buffer,
  ) =>
    wsServer.handleUpgrade(request, socket, head, (ws) => {
      ws.emit("connection", ws, request);
    }),
  nowPlaying: (medium: Medium, chapter?: Chapter) =>
    wsServer.clients.forEach((ws) => {
      cachedMedium = medium;
      cachedChapter = chapter;
      ws.send(
        render("player/_player.pug", {
          title: medium.title,
          chapter: chapter?.title,
        }),
      );
    }),
  mediaStart: (duration: number) =>
    wsServer.clients.forEach((ws) =>
      ws.send(
        render("player/_progress-bar.pug", {
          startTime: cachedChapter?.startTime,
          endTime: cachedChapter?.endTime,
          duration,
        }) +
          render("player/_duration.pug", { duration }) +
          render("player/_pause.pug"),
      ),
    ),
  mediaStop: () =>
    wsServer.clients.forEach((ws) => ws.send(render("player/_replay.pug"))),
  playNext: async () => {
    if (cachedMedium) await reorderRemaining();

    const playQueue = await PlayQueue.findOne({
      include: [Medium, Chapter],
      order: [["order", "ASC"]],
    });

    if (!playQueue) return;

    const { medium, chapter } = playQueue;
    const { startTime, endTime } = chapter || {};

    wsServer.emit("play-next", medium.url, startTime, endTime);
    wss.nowPlaying(medium, chapter);
  },
  currentTime: (currentTime) =>
    wsServer.clients.forEach((ws) => ws.send(JSON.stringify({ currentTime }))),
  latestPlayQueue: async () => {
    const items = await PlayQueue.findAll({
      include: [Medium, Chapter],
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
