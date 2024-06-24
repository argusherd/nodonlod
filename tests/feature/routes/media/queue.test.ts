import PlayQueue from "@/database/models/play-queue";
import express from "@/routes";
import supertest from "supertest";
import { createMedium } from "../../setup/create-model";

describe("The queue medium route", () => {
  it("adds the medium to the play queue", async () => {
    const medium = await createMedium();

    await supertest(express).post(`/media/${medium.id}/queue`).expect(201);

    expect(await PlayQueue.count()).toEqual(1);

    const playQueue = await PlayQueue.findOne();

    expect(playQueue?.mediumId).toEqual(medium.id);
  });

  it("adds the medium to the play queue at the last position", async () => {
    const medium1 = await createMedium();
    const medium2 = await createMedium();

    await PlayQueue.create({ mediumId: medium1.id });

    await supertest(express).post(`/media/${medium2.id}/queue`).expect(201);

    const playSecond = await PlayQueue.findOne({
      where: { mediumId: medium2.id },
    });

    expect(playSecond?.order).toEqual(1);
  });

  it("triggers htmx to reload the play queue list via the header", async () => {
    const medium = await createMedium();

    await supertest(express)
      .post(`/media/${medium.id}/queue`)
      .expect("HX-Trigger", "play-queue");
  });
});
