import express from "@/routes";
import supertest from "supertest";
import { createLabel, createPerformer } from "../../../setup/create-model";

describe("The label performer destroy route", () => {
  it("removes the relationship with the performer from the label", async () => {
    const label = await createLabel();
    const performer = await createPerformer();

    await label.$add("performer", performer);

    await supertest(express)
      .delete(`/labels/${label.id}/performers/${performer.id}`)
      .expect(205);

    expect(await label.$count("performers")).toEqual(0);
  });

  it("has a confirmation page", async () => {
    const label = await createLabel();
    const performer = await createPerformer();

    await label.$add("performer", performer);

    await supertest(express)
      .delete(`/labels/${label.id}/performers/${performer.id}/confirm`)
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(
          "Are you sure you want to remove this performer?",
        );
        expect(res.text).toContain(
          `/labels/${label.id}/performers/${performer.id}`,
        );
      });
  });
});
