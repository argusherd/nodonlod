import express from "@/routes";
import supertest from "supertest";
import { createChapter } from "../../setup/create-model";

describe("The chapter edit page", () => {
  it("shows the title, start time, and end time of the chapter", async () => {
    const chapter = await createChapter({
      title: "foo",
      startTime: 666,
      endTime: 888,
    });

    await supertest(express)
      .get(`/chapters/${chapter.id}/edit`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain("foo");
        expect(res.text).toContain("666");
        expect(res.text).toContain("888");
        expect(res.text).toContain(`hx-put="/chapters/${chapter.id}"`);
      });
  });

  it("tells the frontend show the chapter form", async () => {
    const chapter = await createChapter();

    await supertest(express)
      .get(`/chapters/${chapter.id}/edit`)
      .expect(200)
      .expect("HX-Trigger", "open-modal");
  });
});
