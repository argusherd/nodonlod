import Chapter from "@/database/models/chapter";
import express from "@/routes";
import supertest from "supertest";
import { createChapter } from "../../setup/create-model";

describe("The destroy chapter route", () => {
  it("deletes the chapter", async () => {
    const chapter = await createChapter();

    await supertest(express).delete(`/chapters/${chapter.id}`).expect(205);

    expect(await Chapter.count()).toEqual(0);
  });

  it("tells htmx to refresh the chapter list", async () => {
    const chapter = await createChapter();

    await supertest(express)
      .delete(`/chapters/${chapter.id}`)
      .expect("HX-Trigger", "refresh-chapters");
  });

  it("can display a confirmation message for deletion", async () => {
    const chapter = await createChapter();

    await supertest(express)
      .delete(`/chapters/${chapter.id}/confirm`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(
          `Are you sure you want to delete the chapter ${chapter.title}?`,
        );
        expect(res.text).toContain(`/chapters/${chapter.id}`);
      });
  });
});
