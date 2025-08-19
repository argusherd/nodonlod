import Medium from "@/database/models/medium";
import express from "@/routes";
import dayjs from "dayjs";
import supertest from "supertest";
import { createMedium, createPerformer } from "../../setup/create-model";

describe("The medium index page", () => {
  it("lists media and provides a link for each medium", async () => {
    const medium1 = await createMedium({ playCount: 69420 });
    const medium2 = await createMedium();

    await supertest(express)
      .get("/media")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(medium1.title);
        expect(res.text).toContain(medium2.title);
        expect(res.text).toContain(`"/media/${medium1.id}?"`);
        expect(res.text).toContain(`"/media/${medium2.id}?"`);
        expect(res.text).toContain(`/media/${medium2.id}/play`);
        expect(res.text).toContain(`/media/${medium2.id}/play`);
        expect(res.text).toContain("69,420");
        expect(res.text).toContain(
          dayjs(medium1.createdAt).format("YYYY-MM-DD HH:mm:ss"),
        );
      });
  });

  it("lists 10 media based on the createdAt column in descending order per page by default", async () => {
    const inFirstPage: Medium[] = [];
    const inSecondPage = await createMedium({
      createdAt: dayjs().subtract(1, "hour").toDate(),
    });

    for (let i = 0; i < 10; i++) inFirstPage.push(await createMedium());

    await supertest(express)
      .get("/media?page=1")
      .expect(200)
      .expect((res) => {
        for (const medium of inFirstPage) expect(res.text).toContain(medium.id);

        expect(res.text).not.toContain(inSecondPage.id);
      });

    await supertest(express)
      .get("/media?page=2")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(inSecondPage.id);

        for (const medium of inFirstPage)
          expect(res.text).not.toContain(medium.id);
      });
  });

  it("displays the medium's performers", async () => {
    const medium = await createMedium();
    const performer1 = await createPerformer();
    const performer2 = await createPerformer();

    await medium.$add("performer", [performer1, performer2]);

    await supertest(express)
      .get("/media")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(performer1.name);
        expect(res.text).toContain(performer2.name);
        expect(res.text).toContain(`/performers/${performer1.id}`);
        expect(res.text).toContain(`/performers/${performer2.id}`);
      });
  });

  it("can sort the list based on other columns in ascending or descending order", async () => {
    const earlier = await createMedium({
      createdAt: dayjs().subtract(1, "hour").toDate(),
      title: "foo",
    });
    const later = await createMedium({ title: "bar" });

    await supertest(express)
      .get("/media?sort=title")
      .expect((res) => {
        const inOreder = new RegExp(`${earlier.id}.*${later.id}`);

        expect(inOreder.test(res.text)).toBeTruthy();
      });

    await supertest(express)
      .get("/media?sort=title&sortBy=asc")
      .expect((res) => {
        const inOreder = new RegExp(`${later.id}.*${earlier.id}`);

        expect(inOreder.test(res.text)).toBeTruthy();
      });
  });

  it("can search the title and description of media", async () => {
    const medium1 = await createMedium({ title: "foo" });
    const medium2 = await createMedium({ description: "bar" });

    await supertest(express)
      .get(`/media?search=foo`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(medium1.id);
        expect(res.text).not.toContain(medium2.id);
      });

    await supertest(express)
      .get(`/media?search=bar`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(medium2.id);
        expect(res.text).not.toContain(medium1.id);
      });
  });

  it("distinguishes the media count with associations", async () => {
    const medium1 = await createMedium();
    const medium2 = await createMedium();
    const performer1 = await createPerformer();
    const performer2 = await createPerformer();
    const performer3 = await createPerformer();

    await medium1.$add("performer", [performer1, performer2]);
    await medium2.$add("performer", [performer3]);

    await supertest(express)
      .get("/media")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`1-2 (2)`);
      });
  });
});
