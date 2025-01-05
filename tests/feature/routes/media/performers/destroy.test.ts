import express from "@/routes";
import supertest from "supertest";
import { createMedium, createPerformer } from "../../../setup/create-model";

describe("The medium performer destroy route", () => {
  it("removes the relationship with the performer from the medium", async () => {
    const medium = await createMedium();
    const performer = await createPerformer();

    await medium.$add("performer", performer);

    await supertest(express)
      .delete(`/media/${medium.id}/performers/${performer.id}`)
      .expect(205);

    expect(await medium.$count("performers")).toEqual(0);
  });
});
