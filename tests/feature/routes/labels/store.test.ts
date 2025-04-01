import Label from "@/database/models/label";
import express from "@/routes";
import supertest from "supertest";
import { createLabel } from "../../setup/create-model";

describe("The label store route", () => {
  it("has a dedicated create page", async () => {
    await supertest(express)
      .get("/labels/create")
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain("/labels");
        expect(res.text).toContain("Category");
        expect(res.text).toContain("Text");
      });
  });

  it("requires a text to create a new label", async () => {
    await supertest(express)
      .post("/labels")
      .type("form")
      .send({ category: "foo" })
      .expect(422)
      .expect((res) => {
        expect(res.text).toContain("The text is missing");
      });
  });

  it("can create a new label", async () => {
    await supertest(express)
      .post("/labels")
      .type("form")
      .send({ category: "foo", text: "bar" })
      .expect(201)
      .expect((res) => {
        expect(res.headers["hx-location"]).toContain("/labels/");
      });

    const label = await Label.findOne();

    expect(label?.category).toEqual("foo");
    expect(label?.text).toEqual("bar");
  });

  it("will not create a same label twice", async () => {
    const label = await createLabel();

    await supertest(express)
      .post("/labels")
      .type("form")
      .send({ text: label.text })
      .expect(201);

    expect(await Label.count()).toEqual(1);
  });
});
