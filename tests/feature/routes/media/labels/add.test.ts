import express from "@/routes";
import supertest from "supertest";
import { createLabel, createMedium } from "../../../setup/create-model";

describe("The medium label add route", () => {
  it("establishes the relationship between the medium and the label", async () => {
    const medium = await createMedium();
    const label = await createLabel();

    await supertest(express)
      .post(`/media/${medium.id}/labels/${label.id}`)
      .expect(205)
      .expect((res) => {
        expect(res.headers["hx-trigger"]).toContain("close-modal");
        expect(res.headers["hx-trigger"]).toContain("refresh-labels");
      });

    const labels = await medium.$get("labels");

    expect(labels).toHaveLength(1);
    expect(labels.at(0)?.text).toEqual(label.text);
  });
});
