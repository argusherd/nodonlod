import express from "@/routes";
import supertest from "supertest";
import { createLabel, createMedium } from "../../../setup/create-model";

describe("The medium label add route", () => {
  it("has a dedicated add page", async () => {
    const medium = await createMedium();
    const label1 = await createLabel();
    const label2 = await createLabel();

    await supertest(express)
      .get(`/media/${medium.id}/labels/add`)
      .expect(200)
      .expect((res) => {
        expect(res.headers["hx-trigger"]).toContain("open-modal");
        expect(res.text).toContain(label1.text);
        expect(res.text).toContain(label2.text);
      });
  });

  it("can filter available labels by text", async () => {
    const medium = await createMedium();
    const label1 = await createLabel({ text: "foo" });
    const label2 = await createLabel({ text: "bar" });

    await supertest(express)
      .get(`/media/${medium.id}/labels/add?search=${label2.text}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).not.toContain(label1.text);
        expect(res.text).toContain(label2.text);
      });
  });

  it("can filter available labels by category", async () => {
    const medium = await createMedium();
    const label1 = await createLabel({ category: "foo" });
    const label2 = await createLabel({ category: "bar" });

    await supertest(express)
      .get(`/media/${medium.id}/labels/add?search=${label2.category}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).not.toContain(label1.category);
        expect(res.text).toContain(label2.category);
      });
  });

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
