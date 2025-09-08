import express from "@/routes";
import supertest from "supertest";
import { createLabel, createMedium } from "../../../setup/create-model";

describe("The label medium store route", () => {
  it("establishes the relationship between the label and the medium", async () => {
    const label = await createLabel();
    const medium = await createMedium();

    await supertest(express)
      .post(`/labels/${label.id}/media/${medium.id}`)
      .expect(205)
      .expect((res) => {
        expect(res.headers["hx-trigger"]).toContain("close-modal");
        expect(res.headers["hx-trigger"]).toContain("refresh-media");
      });

    const media = await label.$get("media");

    expect(media).toHaveLength(1);
    expect(media.at(0)?.id).toEqual(medium.id);
  });
});
