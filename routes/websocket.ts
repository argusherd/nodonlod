import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws) => {
  setInterval(() => ws.send(`<p id="time">${Date.now()}</p>`), 1000);
});

export default wss;
