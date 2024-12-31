import express from "@/routes";
import supertest from "supertest";
import { createMedium, createPerformer } from "../../../setup/create-model";

describe("The medium performer index page", () => {
  it("lists all performers with pagination", async () => {
    const medium = await createMedium();
    const firstPerformer = await createPerformer({ name: "111" });

    for (let i = 0; i < 10; i++) await createPerformer();

    await supertest(express)
      .get(`/media/${medium.id}/performers`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(firstPerformer.name);
        expect(res.text).toContain(
          `/media/${medium.id}/performers/${firstPerformer.id}`,
        );
      });

    await supertest(express)
      .get(`/media/${medium.id}/performers?page=2`)
      .expect(200)
      .expect((res) => {
        expect(res.text).not.toContain(firstPerformer.name);
        expect(res.text).not.toContain(
          `/media/${medium.id}/performers/${firstPerformer.id}`,
        );
      });
  });
});
