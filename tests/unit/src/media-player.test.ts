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

    const observeDuration =
      JSON.stringify({ command: ["observe_property", 0, "duration"] }) + "\n";
    const observeTimePos =
      JSON.stringify({ command: ["observe_property", 0, "time-pos"] }) + "\n";

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

    const loadUrl =
      JSON.stringify({
        command: ["loadfile", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
      }) + "\n";

    mediaPlayer.play("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

    expect(mockedWrite).toHaveBeenCalledWith(loadUrl);
  });

  it("can instruct the player to pause the media", () => {
    const mockedWrite = jest.fn();

    jest.mocked(Socket.prototype.write).mockImplementation(mockedWrite);
    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
      }),
    );

    const pasueMedia =
      JSON.stringify({ command: ["set_property", "pause", true] }) + "\n";

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

    const resumeMedia =
      JSON.stringify({ command: ["set_property", "pause", false] }) + "\n";

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

    mediaPlayer.on("duration", (duration) => (expectedDuration = duration));

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

    mediaPlayer.on("duration", shouldNotReceive);

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

    const seek = JSON.stringify({ command: ["seek", 30, "absolute"] }) + "\n";

    mediaPlayer.launch();
    mediaPlayer.seek(30);

    expect(mockedWrite).toHaveBeenCalledWith(seek);
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

    const seek = JSON.stringify({ command: ["seek", 30, "absolute"] }) + "\n";

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

    const pasueMedia =
      JSON.stringify({ command: ["set_property", "pause", true] }) + "\n";

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

    const resumeMedia =
      JSON.stringify({ command: ["set_property", "pause", false] }) + "\n";

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

    const pasueMedia =
      JSON.stringify({ command: ["set_property", "pause", true] }) + "\n";

    mediaPlayer.play("https://www.youtube.com/watch?v=dQw4w9WgXcQ", 0, 30);

    expect(mockedWrite).toHaveBeenCalledWith(pasueMedia);
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
});
