import Medium from "@/database/models/medium";
import express from "@/routes";
import * as playModule from "@/src/currently-playing";
import mediaPlayer from "@/src/media-player";
import supertest from "supertest";
import { createMedium } from "../../setup/create-model";

describe("The medium play route", () => {
  it("instructs the application to play the medium", async () => {
    await createMedium();

    const medium = await Medium.findOne();
    const mockedPlay = jest.fn();

    jest.spyOn(playModule, "play").mockImplementation(mockedPlay);

    await supertest(express)
      .get(`/media/${medium?.id}/play`)
      .expect(202)
      .expect("HX-Trigger", "show-playing");

    expect(mockedPlay).toHaveBeenCalledWith(medium);
  });

  it("cannot instruct the media player to play a medium that does not exist", async () => {
    const mockedPlay = jest.fn();

    jest.spyOn(mediaPlayer, "play").mockImplementation(mockedPlay);

    await supertest(express).get(`/media/NOT_EXISTS/play`).expect(404);
  });
});
