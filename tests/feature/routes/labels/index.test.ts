import express from "@/routes";
import supertest from "supertest";
import { createLabel } from "../../setup/create-model";

describe("The label index page", () => {
  it("displays all available labels", async () => {
    const label1 = await createLabel();
    const label2 = await createLabel({ category: "foo" });

    await supertest(express)
      .get("/labels")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(label1.text);
        expect(res.text).toContain(label2.text);
        expect(res.text).toContain(label2.category);
        expect(res.text).toContain(`/labels/${label1.id}`);
        expect(res.text).toContain(`/labels/${label2.id}`);
      });
  });

  it("can sort the list based on other columns in ascending or descending order", async () => {
    const label1 = await createLabel({ text: "foo" });
    const label2 = await createLabel({ text: "bar" });

    await supertest(express)
      .get(`/labels?sort=text`)
      .expect((res) => {
        const inOreder = new RegExp(`${label1.id}.*${label2.id}`);

        expect(inOreder.test(res.text)).toBeTruthy();
      });

    await supertest(express)
      .get(`/labels?sort=text&sortBy=asc`)
      .expect((res) => {
        const inOreder = new RegExp(`${label2.id}.*${label1.id}`);

        expect(inOreder.test(res.text)).toBeTruthy();
      });
  });

  it("can search the text and category of labels", async () => {
    const label1 = await createLabel({ text: "foo" });
    const label2 = await createLabel({ text: "bar", category: "baz" });

    await supertest(express)
      .get("/labels?search=fo")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(label1.id);
        expect(res.text).not.toContain(label2.id);
      });

    await supertest(express)
      .get("/labels?search=bar")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(label2.id);
        expect(res.text).not.toContain(label1.id);
      });

    await supertest(express)
      .get("/labels?search=baz")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(label2.id);
        expect(res.text).not.toContain(label1.id);
      });
  });
});
