import { Socket } from "net";
import { commandPrompt, mediaPlayer } from "./setup";

describe("The volume feature in the media player", () => {
  it("instructs the player to set the volume", () => {
    const mockedWrite = jest
      .mocked(Socket.prototype.write)
      .mockImplementation();

    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
      }),
    );

    mediaPlayer.launch();
    mediaPlayer.volume(50);

    const pause = commandPrompt(["set_property", "volume", 50]);

    expect(mockedWrite).toHaveBeenCalledWith(pause);
  });

  it("only instructs the player to set the volume when the player is launched", () => {
    const mockedWrite = jest
      .mocked(Socket.prototype.write)
      .mockImplementation();

    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
      }),
    );

    mediaPlayer.volume(50);

    const pause = commandPrompt(["set_property", "volume", 50]);

    expect(mockedWrite).not.toHaveBeenCalledWith(pause);
  });
});
