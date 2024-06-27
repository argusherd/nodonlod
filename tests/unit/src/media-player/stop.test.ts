import { Socket } from "net";
import { commandPrompt, mediaPlayer } from "./setup";

describe("The stop feature in the media player", () => {
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
