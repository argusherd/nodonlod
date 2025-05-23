import express from "@/routes";
import supertest from "supertest";
import { createPerformer } from "../../setup/create-model";

describe("The performer rating route", () => {
  it("can set the rating of the performer", async () => {
    const performer = await createPerformer();

    await supertest(express)
      .put(`/performers/${performer.id}/rating`)
      .type("form")
      .send({ rating: 3 })
      .expect(204);

    await performer.reload();

    expect(performer.rating).toEqual(3);
  });

  it("can only set the rating between 1 to 5", async () => {
    const performer = await createPerformer();

    await supertest(express)
      .put(`/performers/${performer.id}/rating`)
      .type("form")
      .send({ rating: 0 })
      .expect(422);

    await supertest(express)
      .put(`/performers/${performer.id}/rating`)
      .type("form")
      .send({ rating: 6 })
      .expect(422);

    await performer.reload();

    expect(performer.rating).toBeNull();
  });

  it("can reset the rating of the performer", async () => {
    const performer = await createPerformer({ rating: 3 });

    await supertest(express)
      .put(`/performers/${performer.id}/rating`)
      .expect(204);

    await performer.reload();

    expect(performer.rating).toBeNull();
  });
});
