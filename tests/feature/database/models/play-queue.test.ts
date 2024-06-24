import PlayQueue from "@/database/models/play-queue";
import { createChapter, createMedium } from "../../setup/create-model";

describe("The queued medium model", () => {
  it("belongs to a medium", async () => {
    const medium = await createMedium();
    const playQueue = await PlayQueue.create({ mediumId: medium.id });

    const belongsTo = await playQueue.$get("medium");

    expect(belongsTo?.id).toEqual(medium.id);
  });

  it("can belongs to a chapter", async () => {
    const chapter = await createChapter();
    const playQueue = await PlayQueue.create({
      mediumId: chapter.mediumId,
      chapterId: chapter.id,
    });

    const belongsTo = await playQueue.$get("chapter");

    expect(belongsTo?.id).toEqual(chapter.id);
  });
});
