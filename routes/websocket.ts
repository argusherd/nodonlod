import { IncomingMessage } from "http";
import internal from "stream";
import { WebSocketServer } from "ws";

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
  currentTime: (currentTime: number) => void;
  duration: (duration: number) => void;
  dispatch: (event: string) => void;
  on: Pick<WsServer, "on">["on"];
  removeAllListeners: (event: "play-next") => void;
}

const wsServer: WsServer = new WebSocketServer({ noServer: true });

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
  on: (event, listener) => wsServer.on(event, listener),
  removeAllListeners: (event) => wsServer.removeAllListeners(event),
};

export default wss;
