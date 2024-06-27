import { Socket } from "net";
import { commandPrompt, mediaPlayer } from "./setup";

describe("The seek feature in the media player", () => {
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
});
