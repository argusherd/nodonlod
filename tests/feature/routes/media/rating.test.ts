import express from "@/routes";
import supertest from "supertest";
import { createMedium } from "../../setup/create-model";

describe("The medium rating route", () => {
  it("can set the rating of the medium", async () => {
    const medium = await createMedium();

    await supertest(express)
      .put(`/media/${medium.id}/rating`)
      .type("form")
      .send({ rating: 3 })
      .expect(204);

    await medium.reload();

    expect(medium.rating).toEqual(3);
  });

  it("can only set the rating between 1 to 5", async () => {
    const medium = await createMedium();

    await supertest(express)
      .put(`/media/${medium.id}/rating`)
      .type("form")
      .send({ rating: 0 })
      .expect(422);

    await supertest(express)
      .put(`/media/${medium.id}/rating`)
      .type("form")
      .send({ rating: 6 })
      .expect(422);

    await medium.reload();

    expect(medium.rating).toBeNull();
  });

  it("can reset the rating of the medium", async () => {
    const medium = await createMedium({ rating: 3 });

    await supertest(express).put(`/media/${medium.id}/rating`).expect(204);

    await medium.reload();

    expect(medium.rating).toBeNull();
  });
});
