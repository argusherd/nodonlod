import { Socket } from "net";
import { commandPrompt, mediaPlayer } from "./setup";

describe("The mute feature in the media player", () => {
  it("instructs the player to toggle the mute property", () => {
    const mockedWrite = jest
      .mocked(Socket.prototype.write)
      .mockImplementation();

    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
      }),
    );

    mediaPlayer.launch();
    mediaPlayer.mute();

    const setMute = commandPrompt(["set_property", "mute", true]);

    expect(mockedWrite).toHaveBeenCalledWith(setMute);
  });

  it("only instructs the player to toggle the mute property when the player is launched", () => {
    const mockedWrite = jest
      .mocked(Socket.prototype.write)
      .mockImplementation();

    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
      }),
    );

    mediaPlayer.mute();

    const setMute = commandPrompt(["set_property", "mute", true]);

    expect(mockedWrite).not.toHaveBeenCalledWith(setMute);
  });
});
