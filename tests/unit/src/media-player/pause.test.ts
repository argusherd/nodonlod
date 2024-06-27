import { Socket } from "net";
import { commandPrompt, mediaPlayer } from "./setup";

describe("The pause feature in the media player", () => {
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
});
