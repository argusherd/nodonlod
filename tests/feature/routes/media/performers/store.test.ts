import express from "@/routes";
import supertest from "supertest";
import { createMedium } from "../../../setup/create-model";

describe("The medium performer store route", () => {
  it("requires a name to create a new performer", async () => {
    const medium = await createMedium();

    await supertest(express)
      .post(`/media/${medium.id}/performers`)
      .expect(422)
      .expect((res) => {
        expect(res.text).toContain("The name is missing");
      });
  });

  it("creates a new performer and establishes a relationship with the medium", async () => {
    const medium = await createMedium();

    await supertest(express)
      .post(`/media/${medium.id}/performers`)
      .type("form")
      .send({ name: "foo" })
      .expect(201);

    const performers = await medium.$get("performers");

    expect(performers).toHaveLength(1);
    expect(performers.at(0)?.name).toEqual("foo");
  });
});
