import express from "@/routes";
import wss from "@/routes/websocket";
import mediaPlayer from "@/src/media-player";
import supertest from "supertest";
import { createMedium } from "../../setup/create-model";

describe("The medium play route", () => {
  it("can instruct the media player to play the medium", async () => {
    const medium = await createMedium();
    const mockedPlay = jest.fn();

    jest.spyOn(mediaPlayer, "play").mockImplementation(mockedPlay);

    await supertest(express).get(`/media/${medium.id}/play`).expect(202);

    expect(mockedPlay).toHaveBeenCalledWith(medium.url);
  });

  it("cannot instruct the media player to play a medium that does not exist", async () => {
    const mockedPlay = jest.fn();

    jest.spyOn(mediaPlayer, "play").mockImplementation(mockedPlay);

    await supertest(express).get(`/media/NOT_EXISTS/play`).expect(404);
  });

  it("also instructs the websocket to send out the medium information", async () => {
    const medium = await createMedium();
    const mockedNowPlaying = jest.fn();

    jest.spyOn(wss, "nowPlaying").mockImplementation(mockedNowPlaying);

    await supertest(express).get(`/media/${medium.id}/play`);

    expect(mockedNowPlaying).toHaveBeenCalledWith({ title: medium.title });
  });
});
