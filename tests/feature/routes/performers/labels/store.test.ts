import Label from "@/database/models/label";
import express from "@/routes";
import supertest from "supertest";
import { createLabel, createPerformer } from "../../../setup/create-model";

describe("The performer label store route", () => {
  it("requires a text param to create a new label", async () => {
    const performer = await createPerformer();

    await supertest(express)
      .post(`/performers/${performer.id}/labels`)
      .expect(422)
      .expect((res) => {
        expect(res.text).toContain("The text is missing");
      });
  });

  it("establishes the relationship between the performer and the new label", async () => {
    const performer = await createPerformer();

    await supertest(express)
      .post(`/performers/${performer.id}/labels`)
      .type("form")
      .send({ text: "foo" })
      .expect(205)
      .expect((res) => {
        expect(res.headers["hx-trigger"]).toContain("close-modal");
        expect(res.headers["hx-trigger"]).toContain("refresh-labels");
      });

    const labels = await performer.$get("labels");

    expect(labels).toHaveLength(1);
    expect(labels.at(0)?.text).toEqual("foo");
  });

  it("will not create a same label twice", async () => {
    const performer = await createPerformer();
    const label = await createLabel();

    await supertest(express)
      .post(`/performers/${performer.id}/labels`)
      .type("form")
      .send({ text: label.text })
      .expect(205);

    const labels = await performer.$get("labels");

    expect(labels).toHaveLength(1);
    expect(labels.at(0)?.id).toEqual(label.id);
    expect(await Label.count()).toEqual(1);
  });
});
