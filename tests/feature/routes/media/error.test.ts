import express from "@/routes";
import supertest from "supertest";
import { createMedium } from "../../setup/create-model";

describe("The medium error route", () => {
  it("updates the medium with a certain error", async () => {
    const medium = await createMedium();

    await supertest(express)
      .put(`/media/${medium.id}/error`)
      .type("form")
      .send({ message: "file not found" })
      .expect(204);

    await medium.reload();

    expect(medium.hasError).toEqual("file not found");
  });
});
