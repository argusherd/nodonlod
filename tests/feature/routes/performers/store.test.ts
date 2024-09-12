import Performer from "@/database/models/performer";
import express from "@/routes";
import supertest from "supertest";
import { createPerformer } from "../../setup/create-model";

describe("The store performer route", () => {
  it("creates a new performer", async () => {
    await supertest(express)
      .post("/performers")
      .type("form")
      .send({
        name: "foo",
      })
      .expect(201);

    expect(await Performer.count()).toEqual(1);

    const performer = await Performer.findOne();

    expect(performer?.name).toEqual("foo");
  });

  it("needs a name to create a performer", async () => {
    await supertest(express).post("/performers").expect(422);
  });

  it("cannot create a performer with a duplicate name", async () => {
    const performer = await createPerformer();

    await supertest(express)
      .post("/performers")
      .type("form")
      .send({
        name: performer.name,
      })
      .expect(422);
  });

  it("tells htmx redirect the page to the show page", async () => {
    const res = await supertest(express).post("/performers").type("form").send({
      name: "foo",
    });

    const performer = await Performer.findOne();

    expect(res.header["hx-location"]).toEqual(`/performers/${performer?.id}`);
  });
});
