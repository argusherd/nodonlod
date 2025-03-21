import express from "@/routes";
import supertest from "supertest";
import { createLabel, createPerformer } from "../../../setup/create-model";

describe("The performer label index page", () => {
  it("displays all labels related to the performer", async () => {
    const performer = await createPerformer();
    const label1 = await createLabel();
    const label2 = await createLabel();

    await performer.$add("label", [label1, label2]);

    await supertest(express)
      .get(`/performers/${performer.id}/labels`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`/performers/${performer.id}/labels/add`);
        expect(res.text).toContain(label1.text);
        expect(res.text).toContain(label2.text);
      });
  });

  it("can request the label list without including a body", async () => {
    const performer = await createPerformer();
    const label1 = await createLabel({ category: "foo" });
    const label2 = await createLabel({ category: "bar" });

    await performer.$add("label", [label1, label2]);

    await supertest(express)
      .get(`/performers/${performer.id}/labels?_list`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(label1.text);
        expect(res.text).toContain("foo");
        expect(res.text).toContain(label2.text);
        expect(res.text).toContain("bar");
      });
  });
});
