import PlayQueue from "@/database/models/play-queue";
import express from "@/routes";
import supertest from "supertest";
import { createMedium } from "../../setup/create-model";

describe("The play queue destroy route", () => {
  it("can delete all items in the play queue", async () => {
    await PlayQueue.create({
      mediumId: (await createMedium()).id,
    });

    await supertest(express)
      .delete("/play-queues")
      .expect(204)
      .expect("HX-Trigger", "refresh-play-queues");

    expect(await PlayQueue.count()).toEqual(0);
  });
});
