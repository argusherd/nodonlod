import { Socket } from "net";
import { commandPrompt, mediaPlayer } from "./setup";

describe("The play feature in the media player", () => {
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

  it("only instruct the player to stop at a specific time when the endTime param is greater than 0", () => {
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
});
