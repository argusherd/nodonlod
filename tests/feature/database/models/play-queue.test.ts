import PlayQueue from "@/database/models/play-queue";
import { createChapter, createPlayable } from "../../setup/create-model";

describe("The queued playable model", () => {
  it("belongs to a playable", async () => {
    const playable = await createPlayable();
    const playQueue = await PlayQueue.create({ playableId: playable.id });

    const belongsTo = await playQueue.$get("playable");

    expect(belongsTo?.id).toEqual(playable.id);
  });

  it("can belongs to a chapter", async () => {
    const chapter = await createChapter();
    const playQueue = await PlayQueue.create({
      playableId: chapter.playableId,
      chapterId: chapter.id,
    });

    const belongsTo = await playQueue.$get("chapter");

    expect(belongsTo?.id).toEqual(chapter.id);
  });
});
