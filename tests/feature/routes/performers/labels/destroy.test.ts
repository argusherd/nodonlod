import express from "@/routes";
import supertest from "supertest";
import { createLabel, createPerformer } from "../../../setup/create-model";

describe("The playlist label delete route", () => {
  it("removes relationship between the playlist and the label", async () => {
    const performer = await createPerformer();
    const label = await createLabel();

    await performer.$add("label", label);

    await supertest(express)
      .delete(`/performers/${performer.id}/labels/${label.id}`)
      .expect(205)
      .expect("hx-trigger", "refresh-labels");

    expect(await performer.$count("labels")).toEqual(0);
  });

  it("has a confirmation page", async () => {
    const performer = await createPerformer();
    const label = await createLabel();

    await performer.$add("label", label);

    await supertest(express)
      .delete(`/performers/${performer.id}/labels/${label.id}/confirm`)
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(
          "Are you sure you want to remove this label?",
        );
        expect(res.text).toContain(
          `/performers/${performer.id}/labels/${label.id}`,
        );
      });
  });
});
