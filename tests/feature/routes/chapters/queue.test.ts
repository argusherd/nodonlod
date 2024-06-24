import PlayQueue from "@/database/models/play-queue";
import express from "@/routes";
import supertest from "supertest";
import { createChapter } from "../../setup/create-model";

describe("The queue chapter route", () => {
  it("adds the chapter to the play queue", async () => {
    const chapter = await createChapter();

    await supertest(express).post(`/chapters/${chapter.id}/queue`).expect(201);

    expect(await PlayQueue.count()).toEqual(1);

    const playQueue = await PlayQueue.findOne();

    expect(playQueue?.mediumId).toEqual(chapter.mediumId);
    expect(playQueue?.chapterId).toEqual(chapter.id);
  });

  it("adds the chapter to the play queue at the last position", async () => {
    const chapter1 = await createChapter();
    const chapter2 = await createChapter();

    await PlayQueue.create({
      mediumId: chapter1.mediumId,
      chapterId: chapter1.id,
    });

    await supertest(express).post(`/chapters/${chapter2.id}/queue`).expect(201);

    const playSecond = await PlayQueue.findOne({
      where: { chapterId: chapter2.id },
    });

    expect(playSecond?.order).toEqual(1);
  });

  it("triggers htmx to reload the play queue list via the header", async () => {
    const chapter = await createChapter();

    await supertest(express)
      .post(`/chapters/${chapter.id}/queue`)
      .expect("HX-Trigger", "play-queue");
  });
});
