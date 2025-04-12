import express from "@/routes";
import supertest from "supertest";
import { createMedium } from "../../../setup/create-model";

describe("The medium performer create page", () => {
  it("successfully displays the page", async () => {
    const medium = await createMedium();

    await supertest(express)
      .get(`/media/${medium.id}/performers/create`)
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(`/media/${medium.id}/performers`);
      });
  });
});
