import Chapter from "@/database/models/chapter";
import express from "@/routes";
import supertest from "supertest";
import { createMedium } from "../../setup/create-model";

describe("The chapter store route", () => {
  it("requires a title to create a chapter", async () => {
    const medium = await createMedium();

    await supertest(express).post(`/media/${medium.id}/chapters`).expect(422);
  });

  it("requires a numeric start time and a numeric end time", async () => {
    const medium = await createMedium();

    await supertest(express)
      .post(`/media/${medium.id}/chapters`)
      .type("form")
      .send({ title: "foo" })
      .expect(422);

    await supertest(express)
      .post(`/media/${medium.id}/chapters`)
      .type("form")
      .send({ title: "foo", startTime: "bar", endTime: "baz" })
      .expect(422);
  });

  it("requires a positive start time and a positive end time", async () => {
    const medium = await createMedium();

    await supertest(express)
      .post(`/media/${medium.id}/chapters`)
      .type("form")
      .send({ title: "foo", startTime: -10, endTime: -30 })
      .expect(422);
  });

  it("requires the end time to be greater than the start time", async () => {
    const medium = await createMedium();

    await supertest(express)
      .post(`/media/${medium.id}/chapters`)
      .type("form")
      .send({ title: "foo", startTime: 60, endTime: 30 })
      .expect(422);
  });

  it("can create a chapter", async () => {
    const medium = await createMedium();

    await supertest(express)
      .post(`/media/${medium.id}/chapters`)
      .type("form")
      .send({ title: "foo", startTime: 0, endTime: 30 })
      .expect(201);

    expect(await Chapter.count()).toEqual(1);

    const chapter = await Chapter.findOne();

    expect(chapter?.mediumId).toEqual(medium.id);
    expect(chapter?.title).toEqual("foo");
    expect(chapter?.startTime).toEqual(0);
    expect(chapter?.endTime).toEqual(30);
  });
});
