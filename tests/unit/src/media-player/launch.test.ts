import { Socket } from "net";
import { commandPrompt, mediaPlayer } from "./setup";

describe("The observations after the media player launched", () => {
  it("sends a series of commands when launching the player", () => {
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
    const observeVolume = commandPrompt(["observe_property", 0, "volume"]);
    const observeMute = commandPrompt(["observe_property", 0, "mute"]);
    const setVolume = commandPrompt(["set_property", "volume", 100]);
    const setMute = commandPrompt(["set_property", "mute", false]);

    expect(mockedWrite).toHaveBeenCalledWith(observeDuration);
    expect(mockedWrite).toHaveBeenCalledWith(observeTimePos);
    expect(mockedWrite).toHaveBeenCalledWith(observeVolume);
    expect(mockedWrite).toHaveBeenCalledWith(observeMute);
    expect(mockedWrite).toHaveBeenCalledWith(setVolume);
    expect(mockedWrite).toHaveBeenCalledWith(setMute);
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
});
