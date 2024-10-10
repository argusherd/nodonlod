import { play, playNextQueued } from "@/src/currently-playing";
import mediaPlayer from "@/src/media-player";
import {
  createChapter,
  createMedium,
  createPlayQueue,
} from "../../setup/create-model";

describe("The playNextQueued function", () => {
  it("instructs the media player to play the first item in the play queue", async () => {
    const playQueue = await createPlayQueue();
    const medium = await playQueue.$get("medium");
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await playNextQueued();

    expect(mockedPlay).toHaveBeenCalledWith(medium?.url, 0, 0);
  });

  it("can instruct the media player to play the next queued item", async () => {
    const playQueue1 = await createPlayQueue({ order: 1 });
    const playQueue2 = await createPlayQueue({ order: 2 });
    const medium = await playQueue2.$get("medium");
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await play(playQueue1);
    await playNextQueued();

    expect(mockedPlay).toHaveBeenCalledWith(medium?.url, 0, 0);
  });

  it("instruct the media player to play the first item in the play queue if the last item is currently playing", async () => {
    const playQueue1 = await createPlayQueue({ order: 1 });
    const playQueue2 = await createPlayQueue({ order: 2 });
    const medium = await playQueue1.$get("medium");
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await play(playQueue2);
    await playNextQueued();

    expect(mockedPlay).toHaveBeenCalledWith(medium?.url, 0, 0);
  });

  it("plays the chapter if it is associated with an item in the play queue", async () => {
    const medium = await createMedium();
    const chapter = await createChapter({
      mediumId: medium.id,
      startTime: 10,
      endTime: 30,
    });
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await createPlayQueue({ mediumId: medium.id, chapterId: chapter.id });
    await play(null);
    await playNextQueued();

    expect(mockedPlay).toHaveBeenCalledWith(medium.url, 10, 30);
  });
});
