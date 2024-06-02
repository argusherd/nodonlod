import PlayQueue from "@/database/models/play-queue";
import express from "@/routes";
import supertest from "supertest";
import { createChapter, createPlayable } from "../../setup/create-model";

describe("The play queue index page", () => {
  it("lists all playable items in the play queue", async () => {
    const playable1 = await createPlayable();
    const playable2 = await createPlayable();

    await PlayQueue.create({ playableId: playable1.id });
    await PlayQueue.create({ playableId: playable2.id });

    await supertest(express)
      .get("/play-queues")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(playable1.title);
        expect(res.text).toContain(playable2.title);
      });
  });

  it("also lists all chapters associated with the play queue items", async () => {
    const chapter1 = await createChapter();
    const chapter2 = await createChapter();

    await PlayQueue.create({
      playableId: chapter1.playableId,
      chapterId: chapter1.id,
    });
    await PlayQueue.create({
      playableId: chapter2.playableId,
      chapterId: chapter2.id,
    });

    await supertest(express)
      .get("/play-queues")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(chapter1.title);
        expect(res.text).toContain(chapter2.title);
      });
  });

  it("lists the items based on the order in the play queue", async () => {
    const playable1 = await createPlayable();
    const playable2 = await createPlayable();

    await PlayQueue.create({ playableId: playable1.id, order: 15 });
    await PlayQueue.create({ playableId: playable2.id, order: 14 });

    const displayOrder = new RegExp(
      `.*${playable2.title}.*${playable1.title}.*`,
    );

    await supertest(express)
      .get("/play-queues")
      .expect(200)
      .expect((res) => {
        expect(res.text.match(displayOrder)).not.toBeNull();
      });
  });
});
