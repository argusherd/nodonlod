import { Socket } from "net";
import { commandPrompt, mediaPlayer } from "./setup";

describe("The volume feature in the media player", () => {
  it("can observe the player volume property", () => {
    const ipcMessage =
      JSON.stringify({
        event: "property-change",
        name: "volume",
        data: 50,
      }) + "\n";

    jest.mocked(Socket.prototype.on).mockImplementation(
      jest.fn().mockImplementation((event, listener) => {
        if (event === "connect") listener();
        if (event === "data") listener(Buffer.from(ipcMessage));
      }),
    );

    let expectedVolume = 1000;

    mediaPlayer.on("volume", (value) => (expectedVolume = value));
    mediaPlayer.launch();

    expect(expectedVolume).toEqual(50);
  });

  it("emits the volume event only when the payload differs from the current value", () => {
    const ipcMessage =
      JSON.stringify({
        event: "property-change",
        name: "volume",
        data: 100,
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

    const setVolume = commandPrompt(["set_property", "volume", 50]);

    expect(mockedWrite).toHaveBeenCalledWith(setVolume);
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

    const setVolume = commandPrompt(["set_property", "volume", 50]);

    expect(mockedWrite).not.toHaveBeenCalledWith(setVolume);
  });
});
