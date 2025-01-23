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
});
