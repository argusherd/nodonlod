import express from "@/routes";
import supertest from "supertest";
import { createMedium } from "../../setup/create-model";

describe("The medium index page", () => {
  it("lists all media and provides a link for each medium", async () => {
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
});
