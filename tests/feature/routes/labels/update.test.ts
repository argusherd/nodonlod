import express from "@/routes";
import supertest from "supertest";
import { createLabel } from "../../setup/create-model";

describe("The label update route", () => {
  it("requires a text to update the label", async () => {
    const label = await createLabel();

    await supertest(express)
      .put(`/labels/${label.id}`)
      .type("form")
      .send({ category: "foo" })
      .expect(422)
      .expect("hx-trigger", "data-failed")
      .expect((res) => {
        expect(res.text).toContain("The text is missing");
      });

    await label.reload();

    expect(label.category).not.toEqual("foo");
  });

  it("can update the label data", async () => {
    const label = await createLabel();

    await supertest(express)
      .put(`/labels/${label.id}`)
      .type("form")
      .send({ category: "foo", text: "bar" })
      .expect(200);

    await label.reload();

    expect(label.category).toEqual("foo");
    expect(label.text).toEqual("bar");
  });
});
