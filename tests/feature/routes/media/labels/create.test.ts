import express from "@/routes";
import supertest from "supertest";
import { createLabel, createMedium } from "../../../setup/create-model";

describe("The medium label create page", () => {
  it("displays all available labels", async () => {
    const medium = await createMedium();
    const label1 = await createLabel();
    const label2 = await createLabel();

    await supertest(express)
      .get(`/media/${medium.id}/labels/create`)
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(label1.text);
        expect(res.text).toContain(label2.text);
        expect(res.text).toContain(`/media/${medium.id}/labels/${label1.id}`);
        expect(res.text).toContain(`/media/${medium.id}/labels/${label2.id}`);
      });
  });
});
