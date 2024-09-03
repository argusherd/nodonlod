import express from "@/routes";
import supertest from "supertest";
import { createMedium, createPerformer } from "../../setup/create-model";

describe("The medium performer routes", () => {
  it("returns a 404 status code if the performer does not exist", async () => {
    const medium = await createMedium();

    await supertest(express)
      .put(`/media/${medium.id}/performers/NOT_EXIST`)
      .expect(404);
  });

  it("establishes a relationship between the medium and the performer", async () => {
    const medium = await createMedium();
    const performer = await createPerformer();

    await supertest(express)
      .put(`/media/${medium.id}/performers/${performer.id}`)
      .expect(201);

    const belongsToMany = await medium.$get("performers");

    expect(belongsToMany).toHaveLength(1);
    expect(belongsToMany[0]?.id).toEqual(performer.id);
  });

  it("eliminates the relationship between the medium and the performer, if such a relationship exists", async () => {
    const medium = await createMedium();
    const performer = await createPerformer();

    await medium.$add("performer", performer);

    await supertest(express)
      .put(`/media/${medium.id}/performers/${performer.id}`)
      .expect(201);

    expect(await medium.$get("performers")).toHaveLength(0);
  });
});
