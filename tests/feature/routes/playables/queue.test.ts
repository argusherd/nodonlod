import PlayQueue from "@/database/models/play-queue";
import express from "@/routes";
import supertest from "supertest";
import { createPlayable } from "../../setup/create-model";

describe("The queue playable route", () => {
  it("adds the playable to the play queue", async () => {
    const playable = await createPlayable();

    await supertest(express)
      .post(`/playables/${playable.id}/queue`)
      .expect(201);

    expect(await PlayQueue.count()).toEqual(1);

    const playQueue = await PlayQueue.findOne();

    expect(playQueue?.playableId).toEqual(playable.id);
  });

  it("adds the playable to the play queue at the last position", async () => {
    const playable1 = await createPlayable();
    const playable2 = await createPlayable();

    await PlayQueue.create({ playableId: playable1.id });

    await supertest(express)
      .post(`/playables/${playable2.id}/queue`)
      .expect(201);

    const playSecond = await PlayQueue.findOne({
      where: { playableId: playable2.id },
    });

    expect(playSecond?.order).toEqual(1);
  });

  it("triggers htmx to reload the play queue list via the header", async () => {
    const playable = await createPlayable();

    await supertest(express)
      .post(`/playables/${playable.id}/queue`)
      .expect("HX-Trigger", "play-queue");
  });
});
