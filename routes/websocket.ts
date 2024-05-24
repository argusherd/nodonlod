import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { IncomingMessage } from "http";
import { join } from "path";
import { renderFile } from "pug";
import internal from "stream";
import { WebSocketServer } from "ws";

interface MediaInfo {
  title: string;
  chapter?: string;
  startTime?: number;
  endTime?: number;
}

dayjs.extend(duration);

const wsServer = new WebSocketServer({ noServer: true });
const viewDir = process.env.NODE_ENV !== "test" ? "../" : "";
const render = (filename: string, params?: object) =>
  renderFile(join(__dirname, `${viewDir}../views`, filename), {
    ...params,
    dayjs,
  });

const wss = {
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
      ws.send(render("_player.pug", { ...mediaInfo }));
    }),
};

export default wss;
