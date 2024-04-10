import { IncomingMessage } from "http";
import { join } from "path";
import { renderFile } from "pug";
import internal from "stream";
import { WebSocketServer } from "ws";

interface PlayInfo {
  title: string;
}

const wsServer = new WebSocketServer({ noServer: true });
const pug = (filename: string) => join(__dirname, "../../views", filename);

wsServer.on("now-playing", (playInfo: PlayInfo) => {
  wsServer.clients.forEach((ws) =>
    ws.send(renderFile(pug("_player.pug"), { playInfo })),
  );
});

const wss = {
  handleUpgrade: (
    request: IncomingMessage,
    socket: internal.Duplex,
    head: Buffer,
  ) =>
    wsServer.handleUpgrade(request, socket, head, (ws) =>
      ws.emit("connection", ws, request),
    ),
  nowPlaying: (playInfo: PlayInfo) => wsServer.emit("now-playing", playInfo),
};

export default wss;
