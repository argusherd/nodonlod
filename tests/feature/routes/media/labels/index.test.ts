import express from "@/routes";
import supertest from "supertest";
import { createLabel, createMedium } from "../../../setup/create-model";

describe("The medium label index page", () => {
  it("displays all labels related to the medium", async () => {
    const medium = await createMedium();
    const label1 = await createLabel();
    const label2 = await createLabel();

    await medium.$add("label", [label1, label2]);

    await supertest(express)
      .get(`/media/${medium.id}/labels`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(label1.text);
        expect(res.text).toContain(label2.text);
      });
  });

  it("groups labels of the same category together", async () => {
    const medium = await createMedium();
    const label1 = await createLabel({ category: "foo" });
    const label2 = await createLabel({ category: "bar" });

    await medium.$add("label", [label1, label2]);

    await supertest(express)
      .get(`/media/${medium.id}/labels`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(label1.text);
        expect(res.text).toContain("foo");
        expect(res.text).toContain(label2.text);
        expect(res.text).toContain("bar");
      });
  });

  it("can request the label list without including a body", async () => {
    const medium = await createMedium();
    const label1 = await createLabel({ category: "foo" });
    const label2 = await createLabel({ category: "bar" });

    await medium.$add("label", [label1, label2]);

    await supertest(express)
      .get(`/media/${medium.id}/labels?_list`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(label1.text);
        expect(res.text).toContain("foo");
        expect(res.text).toContain(label2.text);
        expect(res.text).toContain("bar");
      });
  });
});
