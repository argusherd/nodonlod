import express from "@/routes";
import supertest from "supertest";
import { createMedium } from "../../setup/create-model";

describe("The medium succeed route", () => {
  it("clears the error from the medium", async () => {
    const medium = await createMedium({ hasError: "file not found" });

    await supertest(express).put(`/media/${medium.id}/succeed`).expect(204);

    await medium.reload();

    expect(medium.hasError).toBeNull();
  });
});
