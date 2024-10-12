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

  it("can broadcast the current play time of the media", () => {
    client.on("message", (data) => {
      expect(data.toString()).toContain(JSON.stringify({ currentTime: 30 }));
    });

    wss.currentTime(30);
  });

  it("can broadcast the duration of the media", () => {
    client.on("message", (data) => {
      expect(data.toString()).toContain(JSON.stringify({ duration: 123 }));
    });

    wss.duration(123);
  });

  it("notifies clients that a custom event should be triggered", () => {
    client.on("message", (data) => {
      expect(data.toString()).toContain(
        JSON.stringify({ event: "refresh-list" }),
      );
    });

    wss.dispatch("refresh-list");
  });
});
