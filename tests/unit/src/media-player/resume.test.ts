import { Socket } from "net";
import { commandPrompt, mediaPlayer } from "./setup";

describe("The resume feature in the media player", () => {
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
});
