import express from "@/routes";
import supertest from "supertest";
import { createLabel, createMedium } from "../../../setup/create-model";

describe("The label medium destroy route", () => {
  it("has a confirmation page", async () => {
    const label = await createLabel();
    const medium = await createMedium();

    await label.$add("medium", medium);

    await supertest(express)
      .delete(`/labels/${label.id}/media/${medium.id}/confirm`)
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(
          "Are you sure you want to remove this medium",
        );
        expect(res.text).toContain(`/labels/${label.id}/media/${medium.id}`);
      });
  });

  it("removes the relationship with the label from the medium", async () => {
    const label = await createLabel();
    const medium = await createMedium();

    await label.$add("medium", medium);

    await supertest(express)
      .delete(`/labels/${label.id}/media/${medium.id}`)
      .expect(204)
      .expect((res) => {
        expect(res.headers["hx-trigger"]).toContain("close-modal");
        expect(res.headers["hx-trigger"]).toContain("refresh-media");
      });

    expect(await label.$count("media")).toEqual(0);
  });
});
