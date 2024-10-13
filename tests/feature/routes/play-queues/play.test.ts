import PlayQueue from "@/database/models/play-queue";
import express from "@/routes";
import * as playModule from "@/src/currently-playing";
import supertest from "supertest";
import { createPlayQueue } from "../../setup/create-model";

describe("The play the item in the play queue route", () => {
  it("instructs the application to play the item in the play queue", async () => {
    await createPlayQueue();

    const playQueue = await PlayQueue.findOne();
    const mockedPlay = jest.spyOn(playModule, "play").mockImplementation();

    await supertest(express)
      .get(`/play-queues/${playQueue?.id}/play`)
      .expect(205)
      .expect("HX-Trigger", "show-playing");

    expect(mockedPlay).toHaveBeenCalledWith(playQueue);
  });
});
