import { Socket } from "net";
import { commandPrompt, mediaPlayer } from "./setup";

describe("The replay feature in the media player", () => {
  it("can instruct the player to replay the previous media", () => {
    const mockedWrite = jest.fn();
    const durationMessage =
      JSON.stringify({
        event: "property-change",
        name: "duration",
        data: 420,
      }) + "\n";

    jest.mocked(Socket.prototype.write).mockImplementation(mockedWrite);
    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
        if (event === "data") listener(Buffer.from(durationMessage));
      }),
    );

    mediaPlayer.play("https://www.youtube.com/watch?v=dQw4w9WgXcQ", 30);
    mediaPlayer.replay();

    const seekToStart = commandPrompt(["seek", 30, "absolute"]);
    const resume = commandPrompt(["set_property", "pause", false]);

    expect(mockedWrite).toHaveBeenCalledWith(seekToStart);
    expect(mockedWrite).toHaveBeenCalledWith(resume);
  });

  it("instructs the player to play the media instead of seeking if the player has lost connection", async () => {
    const mockedWrite = jest.fn();

    let disconnect: Function;

    jest.mocked(Socket.prototype.write).mockImplementation(mockedWrite);
    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation(async (event, listener) => {
        if (event === "close") disconnect = listener;
        if (event === "connect") {
          listener();
          await new Promise(process.nextTick);
          disconnect();
        }
      }),
    );

    mediaPlayer.replay();

    const seekToStart = commandPrompt(["seek", 0, "absolute"]);
    const loadUrl = commandPrompt(["loadfile", ""]);

    expect(mockedWrite).toHaveBeenCalledWith(loadUrl);
    expect(mockedWrite).not.toHaveBeenCalledWith(seekToStart);
  });

  it("only replays the media if the duration is valid", () => {
    const mockedWrite = jest.fn();

    jest.mocked(Socket.prototype.write).mockImplementation(mockedWrite);
    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
      }),
    );

    mediaPlayer.launch();
    mediaPlayer.replay();

    const seekToStart = commandPrompt(["seek", 0, "absolute"]);

    expect(mockedWrite).not.toHaveBeenCalledWith(seekToStart);
  });
});
