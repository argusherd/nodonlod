import Chapter from "@/database/models/chapter";
import express from "@/routes";
import supertest from "supertest";
import { createChapter, createMedium } from "../../setup/create-model";

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
      .expect(422)
      .expect((res) => {
        expect(res.text).toContain(
          "The end time should be greater than the start time.",
        );
      });
  });

  it("requires the end time to be less than or equal to the medium.", async () => {
    const medium = await createMedium({ duration: 123 });

    await supertest(express)
      .post(`/media/${medium.id}/chapters`)
      .type("form")
      .send({ title: "foo", startTime: 60, endTime: 124 })
      .expect(422)
      .expect((res) => {
        expect(res.text).toContain(
          "The start time and the end time should fall within the duration",
        );
      });

    await supertest(express)
      .post(`/media/${medium.id}/chapters`)
      .type("form")
      .send({ title: "foo", startTime: 60, endTime: 123 })
      .expect(201);
  });

  it("can create a chapter", async () => {
    const medium = await createMedium({ duration: 123 });

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

  it("should not create the same chapter for the medium", async () => {
    const medium = await createMedium({ duration: 123 });
    const chapter = await createChapter({
      mediumId: medium.id,
      startTime: 12,
      endTime: 34,
    });

    await supertest(express)
      .post(`/media/${medium.id}/chapters`)
      .type("form")
      .send({
        title: "foo",
        startTime: chapter.startTime,
        endTime: chapter.endTime,
      })
      .expect(422)
      .expect((res) => {
        expect(res.text).toContain(
          "The given start time and end time already exist for the medium",
        );
      });

    const others = await createChapter({ startTime: 34, endTime: 45 });

    await supertest(express)
      .post(`/media/${medium.id}/chapters`)
      .type("form")
      .send({
        title: "foo",
        startTime: others.startTime,
        endTime: others.endTime,
      })
      .expect(201);
  });

  it("tells the frontend to refresh the chapter list", async () => {
    const medium = await createMedium();

    await supertest(express)
      .post(`/media/${medium.id}/chapters`)
      .type("form")
      .send({ title: "foo", startTime: 0, endTime: 1 })
      .expect(201)
      .expect("HX-Trigger", "refresh-chapters, close-modal");
  });
});
