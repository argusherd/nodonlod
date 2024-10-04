import PlayQueue from "@/database/models/play-queue";
import { playNextQueued } from "@/routes/play";
import mediaPlayer from "@/src/media-player";
import {
  createChapter,
  createMedium,
  createPlayQueue,
} from "../../setup/create-model";

describe("The playNextQueued function", () => {
  it("instructs the media player to play the next play queue item", async () => {
    const playQueue = await createPlayQueue();
    const medium = await playQueue.$get("medium");
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await playNextQueued();

    expect(mockedPlay).toHaveBeenCalledWith(medium?.url);
  });

  it("deletes the playing item from the play queue", async () => {
    await createPlayQueue();

    await playNextQueued();

    expect(await PlayQueue.count()).toEqual(0);
  });

  it("decreases the order of the remaining items in the play queue", async () => {
    await createPlayQueue({ order: 1 });
    const remaining = await createPlayQueue({ order: 2 });

    await playNextQueued();

    await remaining.reload();

    expect(remaining.order).toEqual(1);
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

    await playNextQueued();

    expect(mockedPlay).toHaveBeenCalledWith(medium.url, 10, 30);
  });
});
