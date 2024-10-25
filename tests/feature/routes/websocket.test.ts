import wss from "@/routes/websocket";
import { createServer } from "http";
import { WebSocket } from "ws";

describe("The websocket server", () => {
  const httpServer = createServer().on("upgrade", wss.handleUpgrade);
  httpServer.listen(6869);
  const client = new WebSocket("ws://localhost:6869");

  beforeEach(() => {
    client.removeAllListeners();
  });

  afterAll(() => {
    client.close();
    httpServer.close();
  });

  it("can boardcast a json string", () => {
    client.on("message", (data) => {
      expect(data.toString()).toContain(JSON.stringify({ duration: 123 }));
    });

    wss.json("duration", 123);
  });
});
