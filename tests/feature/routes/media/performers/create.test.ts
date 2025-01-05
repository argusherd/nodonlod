import express from "@/routes";
import supertest from "supertest";
import { createMedium, createPerformer } from "../../../setup/create-model";

describe("The medium performer create page", () => {
  it("lists all available performers", async () => {
    const medium = await createMedium();
    const performer1 = await createPerformer();
    const performer2 = await createPerformer();

    await supertest(express)
      .get(`/media/${medium.id}/performers/create`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(performer1.name);
        expect(res.text).toContain(
          `/media/${medium.id}/performers/${performer1.id}`,
        );
        expect(res.text).toContain(performer2.name);
        expect(res.text).toContain(
          `/media/${medium.id}/performers/${performer2.id}`,
        );
      });
  });
});
