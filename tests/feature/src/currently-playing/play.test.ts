import { play } from "@/src/currently-playing";
import mediaPlayer from "@/src/media-player";
import {
  createChapter,
  createMedium,
  createPlayQueue,
  createPlaylistItem,
} from "../../setup/create-model";

describe("The play function", () => {
  it("can instruct the media player to play the medium", async () => {
    const medium = await createMedium();
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

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
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await play(chapter);

    expect(mockedPlay).toHaveBeenCalledWith(medium.url, 10, 30);
  });

  it("can instruct the media player to play the item from a playlist", async () => {
    const medium = await createMedium();
    const chapter = await createChapter({
      mediumId: medium.id,
      startTime: 10,
      endTime: 30,
    });
    const playlistItem = await createPlaylistItem({
      mediumId: medium.id,
      chapterId: chapter.id,
    });
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await play(playlistItem);

    expect(mockedPlay).toHaveBeenCalledWith(medium.url, 10, 30);
  });

  it("can instruct the media player to play the item in the play queue", async () => {
    const medium = await createMedium();
    const chapter = await createChapter({
      mediumId: medium.id,
      startTime: 10,
      endTime: 30,
    });
    const playQueue = await createPlayQueue({
      mediumId: medium.id,
      chapterId: chapter.id,
    });
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await play(playQueue);

    expect(mockedPlay).toHaveBeenCalledWith(medium.url, 10, 30);
  });
});
