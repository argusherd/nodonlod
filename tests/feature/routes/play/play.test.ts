import { play } from "@/routes/play";
import mediaPlayer from "@/src/media-player";
import { createChapter, createMedium } from "../../setup/create-model";

describe("The play function", () => {
  it("can instruct the media player to play the medium", async () => {
    const medium = await createMedium();
    const mockedPlay = jest.fn();

    jest.spyOn(mediaPlayer, "play").mockImplementation(mockedPlay);

    await play(medium);

    expect(mockedPlay).toHaveBeenCalledWith(medium.url);
  });

  it("can instruct the media player to play the chapter of a medium", async () => {
    const medium = await createMedium();
    const chapter = await createChapter({
      mediumId: medium.id,
      startTime: 10,
      endTime: 30,
    });
    const mockedPlay = jest.fn();

    jest.spyOn(mediaPlayer, "play").mockImplementation(mockedPlay);

    await play(chapter);

    expect(mockedPlay).toHaveBeenCalledWith(medium.url, 10, 30);
  });
});
