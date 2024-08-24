import express from "@/routes";
import supertest from "supertest";
import { createMedium, createUploader } from "../../setup/create-model";

describe("The uploader index page", () => {
  it("lists the names and URLs of the uploaders", async () => {
    const uploader1 = await createUploader();
    const uploader2 = await createUploader();

    await supertest(express)
      .get("/uploaders")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(uploader1.name);
        expect(res.text).toContain(uploader1.url);
        expect(res.text).toContain(`/uploaders/${uploader1.id}`);
        expect(res.text).toContain(uploader2.name);
        expect(res.text).toContain(uploader2.url);
        expect(res.text).toContain(`/uploaders/${uploader1.id}`);
      });
  });

  it("displays 10 results per page and sorts them by name in ascending order", async () => {
    for (let i = 0; i < 10; i++) await createUploader();

    const eleventh = await createUploader({ name: "zzz" });

    await supertest(express)
      .get("/uploaders")
      .expect(200)
      .expect((res) => {
        expect(res.text).not.toContain(eleventh.name);
      });

    await supertest(express)
      .get("/uploaders?page=2")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(eleventh.name);
      });
  });

  it("displays the number of the media that uploader has", async () => {
    const uploader = await createUploader();

    for (let i = 0; i < 11; i++)
      await createMedium({ uploaderId: uploader.id });

    await supertest(express)
      .get("/uploaders")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain("(11)");
      });
  });
});
