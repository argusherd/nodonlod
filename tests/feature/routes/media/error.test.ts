import express from "@/routes";
import supertest from "supertest";
import { createMedium } from "../../setup/create-model";

describe("The medium error route", () => {
  it("can tag the medium that has an error while playing it", async () => {
    const medium = await createMedium({ hasError: false });

    await supertest(express).put(`/media/${medium.id}/error`).expect(204);

    await medium.reload();

    expect(medium.hasError).toBeTruthy();
  });
});
