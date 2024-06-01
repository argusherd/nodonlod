import Chapter from "@/database/models/chapter";
import express from "@/routes";
import supertest from "supertest";
import { createChapter } from "../../setup/create-model";

describe("The destroy chapter route", () => {
  it("deletes the chapter", async () => {
    const chapter = await createChapter();

    await supertest(express).delete(`/chapters/${chapter.id}`).expect(204);

    expect(await Chapter.count()).toEqual(0);
  });
});
