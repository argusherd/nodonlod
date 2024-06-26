import { MediaPlayer } from "@/src/media-player";
import { Socket } from "net";

jest.mock("child_process", () => ({
  spawn: jest.fn().mockReturnValue({
    on: jest.fn().mockImplementation((event, listener) => {
      if (event === "spawn") listener();
    }),
  }),
}));

jest.mock("net");

describe("The media player module", () => {
  let mediaPlayer: MediaPlayer;
  const commandPrompt = (command: any[], request_id = 0): string =>
    JSON.stringify({ command, request_id }) + "\n";

  beforeEach(() => {
    jest.resetAllMocks();
    jest.isolateModules(() => {
      ({ default: mediaPlayer } = require("@/src/media-player"));
    });
  });

  it("sends observe property commands when launching the player", () => {
    const mockedWrite = jest.fn();

    jest.mocked(Socket.prototype.write).mockImplementation(mockedWrite);
    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
      }),
    );

    mediaPlayer.launch();

    const observeDuration = commandPrompt(["observe_property", 0, "duration"]);
    const observeTimePos = commandPrompt(["observe_property", 0, "time-pos"]);

    expect(mockedWrite).toHaveBeenCalledWith(observeDuration);
    expect(mockedWrite).toHaveBeenCalledWith(observeTimePos);
  });

  it("can instruct the player to play the provided URL", () => {
    const mockedWrite = jest.fn();

    jest.mocked(Socket.prototype.write).mockImplementation(mockedWrite);
    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
      }),
    );

    const loadUrl = commandPrompt([
      "loadfile",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ]);

    mediaPlayer.play("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

    expect(mockedWrite).toHaveBeenCalledWith(loadUrl);
  });

  it("instructs the player stop the media first if the player is already launched or played", () => {
    const mockedWrite = jest.fn();

    jest.mocked(Socket.prototype.write).mockImplementation(mockedWrite);
    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
      }),
    );

    const stop = commandPrompt(["stop"]);

    mediaPlayer.launch();
    mediaPlayer.play("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

    expect(mockedWrite).toHaveBeenCalledWith(stop);
  });

  it("can instruct the player to pause the media", () => {
    const mockedWrite = jest.fn();

    jest.mocked(Socket.prototype.write).mockImplementation(mockedWrite);
    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
      }),
    );

    const pasueMedia = commandPrompt(["set_property", "pause", true]);

    mediaPlayer.launch();
    mediaPlayer.pause();

    expect(mockedWrite).toHaveBeenCalledWith(pasueMedia);
  });

  it("can instruct the player to resume the media", () => {
    const mockedWrite = jest.fn();

    jest.mocked(Socket.prototype.write).mockImplementation(mockedWrite);
    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
      }),
    );

    const resumeMedia = commandPrompt(["set_property", "pause", false]);

    mediaPlayer.launch();
    mediaPlayer.resume();

    expect(mockedWrite).toHaveBeenCalledWith(resumeMedia);
  });

  it("can observe the player duration event", () => {
    const ipcMessage =
      JSON.stringify({
        event: "property-change",
        name: "duration",
        data: 123.123,
      }) + "\n";

    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
        if (event === "data") listener(Buffer.from(ipcMessage));
      }),
    );

    let expectedDuration = 0;

    mediaPlayer.on("start", (duration) => (expectedDuration = duration));

    mediaPlayer.launch();

    expect(expectedDuration).toEqual(123.123);
  });

  it("can observe the player current-time event", () => {
    const ipcMessage =
      JSON.stringify({
        event: "property-change",
        name: "time-pos",
        data: 12.12,
      }) + "\n";

    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
        if (event === "data") listener(Buffer.from(ipcMessage));
      }),
    );
    let expectedCurrentTime = 0;

    mediaPlayer.on(
      "current-time",
      (currentTime) => (expectedCurrentTime = currentTime),
    );

    mediaPlayer.launch();

    expect(expectedCurrentTime).toEqual(12.12);
  });

  it("instructs the player to retrieve the duration time if the time-pos property is observed but not the duration", () => {
    const ipcMessage =
      JSON.stringify({
        event: "property-change",
        name: "time-pos",
        data: 12.12,
      }) + "\n";

    const mockedWrite = jest.fn();

    jest.mocked(Socket.prototype.write).mockImplementation(mockedWrite);
    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
        if (event === "data") listener(Buffer.from(ipcMessage));
      }),
    );

    const getDuration = commandPrompt(["get_property", "duration"], 1);

    mediaPlayer.play("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

    expect(mockedWrite).toHaveBeenCalledWith(getDuration);
  });

  it("will not receive a duration event if the observed message does not contain a data property", () => {
    const ipcMessage =
      JSON.stringify({
        event: "property-change",
        name: "duration",
      }) + "\n";

    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
        if (event === "data") listener(Buffer.from(ipcMessage));
      }),
    );

    const shouldNotReceive = jest.fn();

    mediaPlayer.on("start", shouldNotReceive);

    mediaPlayer.launch();

    expect(shouldNotReceive).not.toHaveBeenCalled();
  });

  it("will not receive a current-time event if the observed message does not contain a data property", () => {
    const ipcMessage =
      JSON.stringify({
        event: "property-change",
        name: "time-pos",
      }) + "\n";

    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
        if (event === "data") listener(Buffer.from(ipcMessage));
      }),
    );

    const shouldNotReceive = jest.fn();

    mediaPlayer.on("current-time", shouldNotReceive);

    mediaPlayer.launch();

    expect(shouldNotReceive).not.toHaveBeenCalled();
  });

  it("can instruct the player to seek to a specific time", () => {
    const mockedWrite = jest.fn();

    jest.mocked(Socket.prototype.write).mockImplementation(mockedWrite);
    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
      }),
    );

    const seek = commandPrompt(["seek", 30, "absolute"]);
    let currentTime = 0;

    mediaPlayer.on("current-time", (time) => (currentTime = time));
    mediaPlayer.launch();
    mediaPlayer.seek(30);

    expect(mockedWrite).toHaveBeenCalledWith(seek);
    expect(currentTime).toEqual(30);
  });

  it("resumes the player when instructed to seek to a specific time and it has reached the end of the media previously", () => {
    const mockedWrite = jest.fn();

    const durationMessage =
      JSON.stringify({
        event: "property-change",
        name: "duration",
        data: 123,
      }) + "\n";

    const currentTimeMessage =
      JSON.stringify({
        event: "property-change",
        name: "time-pos",
        data: 123,
      }) + "\n";

    jest.mocked(Socket.prototype.write).mockImplementation(mockedWrite);
    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
        if (event === "data") {
          listener(Buffer.from(durationMessage));
          listener(Buffer.from(currentTimeMessage));
        }
      }),
    );

    const resumeMedia = commandPrompt(["set_property", "pause", false]);
    let playerRestarted = false;

    mediaPlayer.on("start", () => (playerRestarted = true));
    mediaPlayer.launch();
    mediaPlayer.seek(30);

    expect(mockedWrite).toHaveBeenCalledWith(resumeMedia);
    expect(playerRestarted).toBeTruthy();
  });

  it("does not resume the player when seeking to a specific time if it has been disconnected and reached the end of the media", async () => {
    const durationMessage =
      JSON.stringify({
        event: "property-change",
        name: "duration",
        data: 123,
      }) + "\n";

    const currentTimeMessage =
      JSON.stringify({
        event: "property-change",
        name: "time-pos",
        data: 123,
      }) + "\n";

    let disconnect: Function;

    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation(async (event, listener) => {
        if (event === "close") disconnect = listener;
        if (event === "connect") {
          listener();
          await new Promise(process.nextTick);
          disconnect();
        }
        if (event === "data") {
          listener(Buffer.from(durationMessage));
          listener(Buffer.from(currentTimeMessage));
        }
      }),
    );

    let playerRestarted = false;

    mediaPlayer.launch();

    await new Promise(process.nextTick);

    mediaPlayer.on("start", () => (playerRestarted = true));
    mediaPlayer.seek(30);

    expect(playerRestarted).toBeFalsy();
  });

  it("can instruct the player to start at a specific time by passing the startTime param", () => {
    const mockedWrite = jest.fn();

    const ipcMessage =
      JSON.stringify({
        event: "property-change",
        name: "duration",
        data: 123.123,
      }) + "\n";

    jest.mocked(Socket.prototype.write).mockImplementation(mockedWrite);
    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
        if (event === "data") listener(Buffer.from(ipcMessage));
      }),
    );

    const seek = commandPrompt(["seek", 30, "absolute"]);

    mediaPlayer.play("https://www.youtube.com/watch?v=dQw4w9WgXcQ", 30);

    expect(mockedWrite).toHaveBeenCalledWith(seek);
  });

  it("instructs the player to pause before seeking the playtime when starting at a specific time", () => {
    const mockedWrite = jest.fn();

    const ipcMessage =
      JSON.stringify({
        event: "property-change",
        name: "duration",
        data: 123.123,
      }) + "\n";

    jest.mocked(Socket.prototype.write).mockImplementation(mockedWrite);
    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
        if (event === "data") listener(Buffer.from(ipcMessage));
      }),
    );

    const pasueMedia = commandPrompt(["set_property", "pause", true]);

    mediaPlayer.play("https://www.youtube.com/watch?v=dQw4w9WgXcQ", 30);

    expect(mockedWrite).toHaveBeenCalledWith(pasueMedia);
  });

  it("resumes the player after seeking the playtime when starting at a specific time", () => {
    const mockedWrite = jest.fn();

    const ipcMessage =
      JSON.stringify({
        event: "property-change",
        name: "duration",
        data: 123.123,
      }) + "\n";

    jest.mocked(Socket.prototype.write).mockImplementation(mockedWrite);
    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
        if (event === "data") listener(Buffer.from(ipcMessage));
      }),
    );

    const resumeMedia = commandPrompt(["set_property", "pause", false]);

    mediaPlayer.play("https://www.youtube.com/watch?v=dQw4w9WgXcQ", 30);

    expect(mockedWrite).toHaveBeenCalledWith(resumeMedia);
  });

  it("instructs the player to stop at a specific time by passing the endTime param when the current time is greater than or equal it", () => {
    const mockedWrite = jest.fn();

    const ipcMessage =
      JSON.stringify({
        event: "property-change",
        name: "time-pos",
        data: 30.01,
      }) + "\n";

    jest.mocked(Socket.prototype.write).mockImplementation(mockedWrite);
    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
        if (event === "data") listener(Buffer.from(ipcMessage));
      }),
    );

    const pasueMedia = commandPrompt(["set_property", "pause", true]);

    mediaPlayer.play("https://www.youtube.com/watch?v=dQw4w9WgXcQ", 0, 30);

    expect(mockedWrite).toHaveBeenCalledWith(pasueMedia);
  });

  it("only instruct the player to stop at a specific time when the endAt param is greater than 0", () => {
    const mockedWrite = jest.fn();

    const ipcMessage =
      JSON.stringify({
        event: "property-change",
        name: "time-pos",
        data: 30.01,
      }) + "\n";

    jest.mocked(Socket.prototype.write).mockImplementation(mockedWrite);
    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
        if (event === "data") listener(Buffer.from(ipcMessage));
      }),
    );

    const pasueMedia = commandPrompt(["set_property", "pause", true]);

    mediaPlayer.play("https://www.youtube.com/watch?v=dQw4w9WgXcQ", 0, 0);

    expect(mockedWrite).not.toHaveBeenCalledWith(pasueMedia);
  });

  it("can observe the player end event", () => {
    const durationMessage =
      JSON.stringify({
        event: "property-change",
        name: "duration",
        data: 30,
      }) + "\n";

    const currentTimeMessage =
      JSON.stringify({
        event: "property-change",
        name: "time-pos",
        data: 30.01,
      }) + "\n";

    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
        if (event === "data") {
          listener(Buffer.from(durationMessage));
          listener(Buffer.from(currentTimeMessage));
        }
      }),
    );

    let endOfMedia = false;

    mediaPlayer.on("end", () => (endOfMedia = true));

    mediaPlayer.launch();

    expect(endOfMedia).toBeTruthy();
  });

  it("can observe the player has reached the specified end time", () => {
    const durationMessage =
      JSON.stringify({
        event: "property-change",
        name: "duration",
        data: 123.123,
      }) + "\n";

    const currentTimeMessage =
      JSON.stringify({
        event: "property-change",
        name: "time-pos",
        data: 30.01,
      }) + "\n";

    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
        if (event === "data") {
          listener(Buffer.from(durationMessage));
          listener(Buffer.from(currentTimeMessage));
        }
      }),
    );

    let endOfChapter = false;

    mediaPlayer.on("end", () => (endOfChapter = true));

    mediaPlayer.play("https://www.youtube.com/watch?v=dQw4w9WgXcQ", 0, 30);

    expect(endOfChapter).toBeTruthy();
  });

  it("only emits the player end event when there is a duration because local files sometimes do not callback the duration", () => {
    const currentTimeMessage =
      JSON.stringify({
        event: "property-change",
        name: "time-pos",
        data: 30.01,
      }) + "\n";

    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
        if (event === "data") listener(Buffer.from(currentTimeMessage));
      }),
    );

    let endOfMedia = false;

    mediaPlayer.on("end", () => (endOfMedia = true));

    mediaPlayer.play("file:///C:/Users/user/Desktop/NGGYU.mp4");

    expect(endOfMedia).toBeFalsy();
  });

  it("can instruct the player to stop", () => {
    const mockedWrite = jest.fn();

    jest.mocked(Socket.prototype.write).mockImplementation(mockedWrite);
    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
      }),
    );

    mediaPlayer.launch();
    mediaPlayer.stop();

    const pause = commandPrompt(["set_property", "pause", true]);

    expect(mockedWrite).toHaveBeenCalledWith(pause);
  });

  it("resets the starting time when the player is instructed to stop", () => {
    const mockedWrite = jest.fn();

    jest.mocked(Socket.prototype.write).mockImplementation(mockedWrite);
    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
      }),
    );

    mediaPlayer.play("https://www.youtube.com/watch?v=dQw4w9WgXcQ", 30);
    mediaPlayer.stop();

    const reset = commandPrompt(["seek", 30, "absolute"]);

    expect(mockedWrite).toHaveBeenCalledWith(reset);
  });

  it("omits the player stop event if received a end-file message", () => {
    const endFile = JSON.stringify({ event: "end-file" }) + "\n";

    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
        if (event === "data") listener(Buffer.from(endFile));
      }),
    );

    let mediaStop = false;

    mediaPlayer.on("stop", () => (mediaStop = true));
    mediaPlayer.launch();

    expect(mediaStop).toBeTruthy();
  });
});
