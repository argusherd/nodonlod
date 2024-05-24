import wss from "@/routes/websocket";
import { createServer } from "http";
import { WebSocket } from "ws";

describe("The websocket server", () => {
  const httpServer = createServer().on("upgrade", wss.handleUpgrade);
  httpServer.listen(6869);
  const client = new WebSocket("ws://localhost:6869");

  afterAll(() => {
    client.close();
    httpServer.close();
  });

  it("can broadcast the media information", () => {
    client.on("message", (data) => {
      expect(data.toString()).toContain(
        "Rick Astley - Never Gonna Give You Up",
      );
    });

    wss.nowPlaying({ title: "Rick Astley - Never Gonna Give You Up" });
  });

  it("can broadcast the media information with chapter", () => {
    client.on("message", (data) => {
      const res = data.toString();
      expect(res).toContain("Rick Astley - Never Gonna Give You Up");
      expect(res).toContain("foo");
      expect(res).toContain("00:00:10");
      expect(res).toContain("00:00:30");
    });

    wss.nowPlaying({
      title: "Rick Astley - Never Gonna Give You Up",
      chapter: "foo",
      startTime: 10,
      endTime: 30,
    });
  });
});
