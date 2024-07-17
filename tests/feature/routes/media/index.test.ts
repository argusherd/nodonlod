import Medium from "@/database/models/medium";
import express from "@/routes";
import dayjs from "dayjs";
import supertest from "supertest";
import { createMedium } from "../../setup/create-model";

describe("The medium index page", () => {
  it("lists extractions and provides a link for each extraction", async () => {
    const medium1 = await createMedium();
    const medium2 = await createMedium();

    await supertest(express)
      .get("/media")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(medium1.title);
        expect(res.text).toContain(medium2.title);
        expect(res.text).toContain(`"/media/${medium1.id}"`);
        expect(res.text).toContain(`"/media/${medium2.id}"`);
        expect(res.text).toContain(`/media/${medium2.id}/play`);
        expect(res.text).toContain(`/media/${medium2.id}/play`);
      });
  });

  it("lists 10 media based on the createdAt column in descending order per page", async () => {
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
});
