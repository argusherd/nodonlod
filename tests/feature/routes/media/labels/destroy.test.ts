import express from "@/routes";
import supertest from "supertest";
import { createLabel, createMedium } from "../../../setup/create-model";

describe("The medium label delete route", () => {
  it("removes relationship between the medium and the label", async () => {
    const medium = await createMedium();
    const label = await createLabel();

    await medium.$add("label", label);

    await supertest(express)
      .delete(`/media/${medium.id}/labels/${label.id}`)
      .expect(205)
      .expect("hx-trigger", "refresh-labels");

    expect(await medium.$count("labels")).toEqual(0);
  });

  it("has a confirmation page", async () => {
    const medium = await createMedium();
    const label = await createLabel();

    await medium.$add("label", label);

    await supertest(express)
      .delete(`/media/${medium.id}/labels/${label.id}/confirm`)
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(
          "Are you sure you want to remove this label?",
        );
        expect(res.text).toContain(`/media/${medium.id}/labels/${label.id}`);
      });
  });
});
