import express from "@/routes";
import supertest from "supertest";
import { createLabel } from "../../../setup/create-model";

describe("The label performer store route", () => {
  it("successfully displays the page", async () => {
    const label = await createLabel();

    await supertest(express)
      .get(`/labels/${label.id}/performers/create`)
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(`/labels/${label.id}/performers`);
      });
  });

  it("requires a name to create a new performer", async () => {
    const label = await createLabel();

    await supertest(express)
      .post(`/labels/${label.id}/performers`)
      .expect(422)
      .expect((res) => {
        expect(res.text).toContain("The name is missing");
      });
  });

  it("creates a new performer and establishes a relationship with the label", async () => {
    const label = await createLabel();

    await supertest(express)
      .post(`/labels/${label.id}/performers`)
      .type("form")
      .send({
        name: "foo",
        thumbnail: "https://image.com/foo.jpg",
        description: "bar",
      })
      .expect(201)
      .expect((res) => {
        expect(res.headers["hx-trigger"]).toContain("close-modal");
        expect(res.headers["hx-trigger"]).toContain("refresh-performers");
      });

    const performers = await label.$get("performers");

    expect(performers).toHaveLength(1);
    expect(performers.at(0)?.name).toEqual("foo");
    expect(performers.at(0)?.thumbnail).toEqual("https://image.com/foo.jpg");
    expect(performers.at(0)?.description).toEqual("bar");
  });
});
