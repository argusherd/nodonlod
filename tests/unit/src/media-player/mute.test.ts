import { Socket } from "net";
import { commandPrompt, mediaPlayer } from "./setup";

describe("The mute feature in the media player", () => {
  it("can observe the player mute property", () => {
    const ipcMessage =
      JSON.stringify({
        event: "property-change",
        name: "mute",
        data: true,
      }) + "\n";

    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
        if (event === "data") listener(Buffer.from(ipcMessage));
      }),
    );

    let expectedMute = false;

    mediaPlayer.on("mute", (value) => (expectedMute = value));
    mediaPlayer.launch();

    expect(expectedMute).toBeTruthy();
  });

  it("emits the mute event only when the payload differs from the current value", () => {
    const ipcMessage =
      JSON.stringify({
        event: "property-change",
        name: "mute",
        data: false,
      }) + "\n";

    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
        if (event === "data") listener(Buffer.from(ipcMessage));
      }),
    );

    const test = jest.fn().mockImplementation();

    mediaPlayer.on("volume", () => test());
    mediaPlayer.launch();

    expect(test).not.toHaveBeenCalled();
  });

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
