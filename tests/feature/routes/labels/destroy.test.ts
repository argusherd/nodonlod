import Label from "@/database/models/label";
import express from "@/routes";
import supertest from "supertest";
import { createLabel } from "../../setup/create-model";

describe("The label destroy route", () => {
  it("has a confirmation page", async () => {
    const label = await createLabel();

    await supertest(express)
      .delete(`/labels/${label.id}/confirm`)
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(
          "Are you sure you want to delete this label?",
        );
        expect(res.text).toContain(`/labels/${label.id}`);
      });
  });

  it("removes the label from the database", async () => {
    const label = await createLabel();

    await supertest(express)
      .delete(`/labels/${label.id}`)
      .expect(205)
      .expect("hx-location", "/labels");

    expect(await Label.count()).toEqual(0);
  });
});
