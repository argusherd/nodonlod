import PlayQueue from "@/database/models/play-queue";
import express from "@/routes";
import supertest from "supertest";
import { createChapter, createMedium } from "../../setup/create-model";

describe("The play queue index page", () => {
  it("lists all medium items in the play queue", async () => {
    const medium1 = await createMedium();
    const medium2 = await createMedium();

    const playQyeye1 = await PlayQueue.create({ mediumId: medium1.id });
    const playQyeye2 = await PlayQueue.create({ mediumId: medium2.id });

    await supertest(express)
      .get("/play-queues")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(medium1.title);
        expect(res.text).toContain(medium2.title);
        expect(res.text).toContain(`/play-queues/${playQyeye1.id}/play`);
        expect(res.text).toContain(`/play-queues/${playQyeye2.id}/play`);
      });
  });

  it("also lists all chapters associated with the play queue items", async () => {
    const chapter1 = await createChapter();
    const chapter2 = await createChapter();

    const playQueue1 = await PlayQueue.create({
      mediumId: chapter1.mediumId,
      chapterId: chapter1.id,
    });
    const playQueue2 = await PlayQueue.create({
      mediumId: chapter2.mediumId,
      chapterId: chapter2.id,
    });

    await supertest(express)
      .get("/play-queues")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(chapter1.title);
        expect(res.text).toContain(chapter2.title);
        expect(res.text).toContain(`/play-queues/${playQueue1.id}/play`);
        expect(res.text).toContain(`/play-queues/${playQueue2.id}/play`);
      });
  });

  it("lists the items based on the order in the play queue", async () => {
    const medium1 = await createMedium();
    const medium2 = await createMedium();

    await PlayQueue.create({ mediumId: medium1.id, order: 15 });
    await PlayQueue.create({ mediumId: medium2.id, order: 14 });

    const displayOrder = new RegExp(`.*${medium2.title}.*${medium1.title}.*`);

    await supertest(express)
      .get("/play-queues")
      .expect(200)
      .expect((res) => {
        expect(res.text.match(displayOrder)).not.toBeNull();
      });
  });
});
