import express from "@/routes";
import supertest from "supertest";
import { createMedium } from "../../setup/create-model";

describe("The medium play count route", () => {
  it("increases the medium play count by one", async () => {
    const medium = await createMedium({ playCount: 68 });

    await supertest(express).put(`/media/${medium.id}/play-count`).expect(204);

    await medium.reload();

    expect(medium.playCount).toEqual(69);
  });
});
