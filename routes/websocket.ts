import { IncomingMessage } from "http";
import internal from "stream";
import { WebSocketServer } from "ws";

export interface WSS {
  handleUpgrade: (
    request: IncomingMessage,
    socket: internal.Duplex,
    head: Buffer,
  ) => void;
  currentTime: (currentTime: number) => void;
  duration: (duration: number) => void;
  dispatch: (event: string) => void;
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
  currentTime: (currentTime) =>
    wsServer.clients.forEach((ws) => ws.send(JSON.stringify({ currentTime }))),
  duration: (duration) =>
    wsServer.clients.forEach((ws) => ws.send(JSON.stringify({ duration }))),
  dispatch: (event) =>
    wsServer.clients.forEach((ws) => ws.send(JSON.stringify({ event }))),
};

export default wss;
