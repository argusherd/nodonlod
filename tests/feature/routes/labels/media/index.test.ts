import express from "@/routes";
import supertest from "supertest";
import { createLabel, createMedium } from "../../../setup/create-model";

describe("The label media index page", () => {
  it("displays all related media from the given label", async () => {
    const label = await createLabel();
    const medium1 = await createMedium();
    const medium2 = await createMedium();

    await label.$add("medium", [medium1, medium2]);

    await supertest(express)
      .get(`/labels/${label.id}/media`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`/media/${medium1.id}`);
        expect(res.text).toContain(medium1.title);
        expect(res.text).toContain(`/media/${medium2.id}`);
        expect(res.text).toContain(medium2.title);
      });
  });

  it("can request the list part of the page", async () => {
    const label = await createLabel();
    const medium = await createMedium();

    await label.$add("medium", medium);

    await supertest(express)
      .get(`/labels/${label.id}/media`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(medium.title);
        expect(res.text).toContain(`/media/${medium.id}`);
      });
  });
});
