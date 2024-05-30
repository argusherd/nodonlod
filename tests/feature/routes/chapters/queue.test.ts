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

    expect(playQueue?.playableId).toEqual(chapter.playableId);
    expect(playQueue?.chapterId).toEqual(chapter.id);
  });

  it("adds the chapter to the play queue at the last position", async () => {
    const chapter1 = await createChapter();
    const chapter2 = await createChapter();

    await PlayQueue.create({
      playableId: chapter1.playableId,
      chapterId: chapter1.id,
    });

    await supertest(express).post(`/chapters/${chapter2.id}/queue`).expect(201);

    const playSecond = await PlayQueue.findOne({
      where: { chapterId: chapter2.id },
    });

    expect(playSecond?.order).toEqual(1);
  });
});