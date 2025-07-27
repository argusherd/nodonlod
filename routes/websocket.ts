import { IncomingMessage } from "http";
import internal from "stream";
import { WebSocketServer } from "ws";

export interface WSS {
  handleUpgrade: (
    request: IncomingMessage,
    socket: internal.Duplex,
    head: Buffer,
  ) => void;
  json: (payload: object) => void;
}

const wsServer = new WebSocketServer({ noServer: true });

const wss: WSS = {
  handleUpgrade: (
    request: IncomingMessage,
    socket: internal.Duplex,
    head: Buffer,
  ) =>
    wsServer.handleUpgrade(request, socket, head, (ws) => {
      ws.emit("connection", ws, request);
    }),
  json: (payload: object) =>
    wsServer.clients.forEach((ws) => ws.send(JSON.stringify(payload))),
};

export default wss;
