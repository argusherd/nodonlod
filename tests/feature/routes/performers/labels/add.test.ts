import express from "@/routes";
import supertest from "supertest";
import { createLabel, createPerformer } from "../../../setup/create-model";

describe("The performer label add route", () => {
  it("has a dedicated add page", async () => {
    const performer = await createPerformer();
    const label1 = await createLabel();
    const label2 = await createLabel();

    await supertest(express)
      .get(`/performers/${performer.id}/labels/add`)
      .expect(200)
      .expect((res) => {
        expect(res.headers["hx-trigger"]).toContain("open-modal");
        expect(res.text).toContain(label1.text);
        expect(res.text).toContain(label2.text);
        expect(res.text).toContain(
          `/performers/${performer.id}/labels/${label1.id}`,
        );
        expect(res.text).toContain(
          `/performers/${performer.id}/labels/${label2.id}`,
        );
      });
  });

  it("can filter available labels by text or category", async () => {
    const performer = await createPerformer();
    const label1 = await createLabel({ category: "as foo 1", text: "foo" });
    const label2 = await createLabel({ category: "as bar 2", text: "baz" });

    await supertest(express)
      .get(`/performers/${performer.id}/labels/add?search=foo`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(label1.id);
        expect(res.text).not.toContain(label2.id);
      });

    await supertest(express)
      .get(`/performers/${performer.id}/labels/add?search=baz`)
      .expect(200)
      .expect((res) => {
        expect(res.text).not.toContain(label1.id);
        expect(res.text).toContain(label2.id);
      });
  });

  it("can sort the list based on other columns in ascending or descending order", async () => {
    const performer = await createPerformer();
    const label1 = await createLabel({ text: "foo" });
    const label2 = await createLabel({ text: "bar" });

    await supertest(express)
      .get(`/performers/${performer.id}/labels/add?sort=text`)
      .expect((res) => {
        const inOreder = new RegExp(`${label1.id}.*${label2.id}`);

        expect(inOreder.test(res.text)).toBeTruthy();
      });

    await supertest(express)
      .get(`/performers/${performer.id}/labels/add?sort=text&sortBy=asc`)
      .expect((res) => {
        const inOreder = new RegExp(`${label2.id}.*${label1.id}`);

        expect(inOreder.test(res.text)).toBeTruthy();
      });
  });

  it("establishes the relationship between the performer and the label", async () => {
    const performer = await createPerformer();
    const label = await createLabel();

    await supertest(express)
      .post(`/performers/${performer.id}/labels/${label.id}`)
      .expect(205)
      .expect((res) => {
        expect(res.headers["hx-trigger"]).toContain("close-modal");
        expect(res.headers["hx-trigger"]).toContain("refresh-labels");
      });

    const labels = await performer.$get("labels");

    expect(labels).toHaveLength(1);
    expect(labels.at(0)?.text).toEqual(label.text);
  });
});
