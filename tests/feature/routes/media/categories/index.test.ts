import express from "@/routes";
import supertest from "supertest";
import { createLabel, createMedium } from "../../../setup/create-model";

describe("The medium category index page", () => {
  it("displays all categories and labels associated with the medium", async () => {
    const medium = await createMedium();
    const label = await createLabel();
    const category = await label.$get("category");

    await medium.$add("label", label);

    await supertest(express)
      .get(`/media/${medium.id}/categories`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(category?.name);
        expect(res.text).toContain(label.text);
      });
  });
});
