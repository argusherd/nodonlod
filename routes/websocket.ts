import { IncomingMessage } from "http";
import internal from "stream";
import { WebSocketServer } from "ws";

export interface WSS {
  handleUpgrade: (
    request: IncomingMessage,
    socket: internal.Duplex,
    head: Buffer,
  ) => void;
  json: (key: string, value: any) => void;
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
  json: (key: string, value: any) =>
    wsServer.clients.forEach((ws) => ws.send(JSON.stringify({ [key]: value }))),
};

export default wss;
