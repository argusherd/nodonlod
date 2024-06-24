import Medium from "@/database/models/medium";
import express from "@/routes";
import supertest from "supertest";
import { createMedium } from "../../setup/create-model";

describe("The destory medium route", () => {
  it("deletes the medium", async () => {
    const medium = await createMedium();

    await supertest(express).delete(`/media/${medium.id}`).expect(204);

    expect(await Medium.count()).toEqual(0);
  });
});
