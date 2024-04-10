import { IncomingMessage } from "http";
import { join } from "path";
import { renderFile } from "pug";
import internal from "stream";
import { WebSocketServer } from "ws";

interface MediaInfo {
  title: string;
}

const wsServer = new WebSocketServer({ noServer: true });
const viewDir = process.env.NODE_ENV !== "test" ? "../" : "";
const pug = (filename: string) =>
  join(__dirname, `${viewDir}../views`, filename);

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
      ws.send(renderFile(pug("_player.pug"), { mediaInfo }));
    }),
};

export default wss;
