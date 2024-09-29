import { play } from "@/routes/play";
import mediaPlayer from "@/src/media-player";
import { createMedium } from "../../setup/create-model";

describe("The play function", () => {
  it("can instruct the media player to play the medium", async () => {
    const medium = await createMedium();
    const mockedPlay = jest.fn();

    jest.spyOn(mediaPlayer, "play").mockImplementation(mockedPlay);

    await play(medium);

    expect(mockedPlay).toHaveBeenCalledWith(medium.url);
  });
});
