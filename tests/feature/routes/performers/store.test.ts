import Performer from "@/database/models/performer";
import express from "@/routes";
import supertest from "supertest";

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
    await supertest(express)
      .post("/performers")
      .expect(422)
      .expect((res) => {
        expect(res.text).toContain("The name is missing.");
      });
  });

  it("tells htmx redirect the page to the show page", async () => {
    const res = await supertest(express).post("/performers").type("form").send({
      name: "foo",
    });

    const performer = await Performer.findOne();

    expect(res.header["hx-location"]).toEqual(`/performers/${performer?.id}`);
  });
});
