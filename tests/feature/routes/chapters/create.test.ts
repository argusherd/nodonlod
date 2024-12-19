import express from "@/routes";
import supertest from "supertest";
import { createMedium } from "../../setup/create-model";

describe("The create a chapter page", () => {
  it("renders a form that creates a new chapter", async () => {
    const medium = await createMedium();

    await supertest(express)
      .get(`/media/${medium.id}/chapters/create`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain("title");
        expect(res.text).toContain("startTime");
        expect(res.text).toContain("endTime");
        expect(res.text).toContain(`/media/${medium.id}/chapters`);
      });
  });

  it("tells the frontend to display the chapter form", async () => {
    const medium = await createMedium();

    await supertest(express)
      .get(`/media/${medium.id}/chapters/create`)
      .expect(200)
      .expect("HX-Trigger", "open-modal");
  });
});
