import express from "@/routes";
import supertest from "supertest";
import { createChapter, createMedium } from "../../setup/create-model";

describe("The chapter index page", () => {
  it("displays all the chapters of the medium", async () => {
    const medium = await createMedium();
    const chapter1 = await createChapter({ mediumId: medium.id, title: "ep1" });
    const chapter2 = await createChapter({ mediumId: medium.id, title: "ep2" });

    await supertest(express)
      .get(`/media/${medium.id}/chapters`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain("ep1");
        expect(res.text).toContain("ep2");
        expect(res.text).toContain(`/chapters/${chapter1.id}/play`);
        expect(res.text).toContain(`/chapters/${chapter2.id}/play`);
      });
  });
});
