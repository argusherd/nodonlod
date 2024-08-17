import express from "@/routes";
import supertest from "supertest";
import { createChapter, createMedium } from "../../setup/create-model";

describe("The chapter update route", () => {
  it("can update the title, start time and end time of the chapter", async () => {
    const chapter = await createChapter();

    await supertest(express)
      .put(`/chapters/${chapter.id}`)
      .type("form")
      .send({ title: "foo", startTime: 12, endTime: 23 })
      .expect(205);

    await chapter.reload();

    expect(chapter.title).toEqual("foo");
    expect(chapter.startTime).toEqual(12);
    expect(chapter.endTime).toEqual(23);
  });

  it("requires a title to udpate a chapter", async () => {
    const chapter = await createChapter();

    await supertest(express)
      .put(`/chapters/${chapter.id}`)
      .type("form")
      .send({ startTime: 12, endTime: 23 })
      .expect(422);
  });

  it("requires a numeric start time and a numeric end time", async () => {
    const chapter = await createChapter();

    await supertest(express)
      .put(`/chapters/${chapter.id}`)
      .type("form")
      .send({ title: "foo" })
      .expect(422);

    await supertest(express)
      .put(`/chapters/${chapter.id}`)
      .type("form")
      .send({ title: "foo", startTime: "bar", endTime: "baz" })
      .expect(422);
  });

  it("requires a positive start time and a positive end time", async () => {
    const chapter = await createChapter();

    await supertest(express)
      .put(`/chapters/${chapter.id}`)
      .type("form")
      .send({ title: "foo", startTime: -10, endTime: -30 })
      .expect(422);
  });

  it("requires the end time to be greater than the start time", async () => {
    const chapter = await createChapter();

    await supertest(express)
      .put(`/chapters/${chapter.id}`)
      .type("form")
      .send({ title: "foo", startTime: 60, endTime: 30 })
      .expect(422);
  });

  it("requires the end time to be less than or equal to the medium.", async () => {
    const medium = await createMedium({ duration: 123 });
    const chapter = await createChapter({ mediumId: medium.id });

    await supertest(express)
      .put(`/chapters/${chapter.id}`)
      .type("form")
      .send({ title: "foo", startTime: 60, endTime: 124 })
      .expect(422);

    await supertest(express)
      .put(`/chapters/${chapter.id}`)
      .type("form")
      .send({ title: "foo", startTime: 60, endTime: 123 })
      .expect(205);
  });
});
