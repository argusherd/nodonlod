import express from "@/routes";
import dayjs from "dayjs";
import supertest from "supertest";
import { createMedium, createUploader } from "../../setup/create-model";

describe("The uploader show page", () => {
  it("returns a 404 status code for non-existent uploaders", async () => {
    await supertest(express).get(`/uploaders/NOT_EXISTS`).expect(404);
  });

  it("displays the name and URL of the uploader", async () => {
    const uploader = await createUploader();

    await supertest(express)
      .get(`/uploaders/${uploader.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(uploader.name);
        expect(res.text).toContain(uploader.url);
      });
  });

  it("lists 10 media items sorted by upload date in descending order on each page", async () => {
    const uploader = await createUploader();

    for (let i = 0; i < 10; i++)
      await createMedium({ uploaderId: uploader.id, uploadDate: new Date() });

    const eleventh = await createMedium({
      uploaderId: uploader.id,
      uploadDate: dayjs().subtract(1, "day").toDate(),
    });

    await supertest(express)
      .get(`/uploaders/${uploader.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).not.toContain(eleventh.id);
      });

    await supertest(express)
      .get(`/uploaders/${uploader.id}?page=2`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(eleventh.id);
      });
  });
});
