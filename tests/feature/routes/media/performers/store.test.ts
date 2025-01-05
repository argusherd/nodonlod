import express from "@/routes";
import supertest from "supertest";
import { createMedium, createPerformer } from "../../../setup/create-model";

describe("The medium performer store route", () => {
  it("creates the relationship between the performer and the medium", async () => {
    const medium = await createMedium();
    const performer = await createPerformer();

    await supertest(express)
      .post(`/media/${medium.id}/performers/${performer.id}`)
      .expect(205);

    expect(await medium.$count("performers")).toEqual(1);
  });
});
