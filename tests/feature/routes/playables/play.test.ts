import express from "@/routes";
import wss from "@/routes/websocket";
import mediaPlayer from "@/src/media-player";
import supertest from "supertest";
import { createPlayable } from "../../setup/create-model";

describe("The playable play route", () => {
  it("can instruct the media player to play the playable", async () => {
    const playable = await createPlayable();
    const mockedPlay = jest.fn();

    jest.spyOn(mediaPlayer, "play").mockImplementation(mockedPlay);

    await supertest(express).get(`/playables/${playable.id}/play`).expect(202);

    expect(mockedPlay).toHaveBeenCalledWith(playable.url);
  });

  it("cannot instruct the media player to play a playable that does not exist", async () => {
    const mockedPlay = jest.fn();

    jest.spyOn(mediaPlayer, "play").mockImplementation(mockedPlay);

    await supertest(express).get(`/playables/NOT_EXISTS/play`).expect(404);
  });

  it("also instructs the websocket to send out the playable information", async () => {
    const playable = await createPlayable();
    const mockedNowPlaying = jest.fn();

    jest.spyOn(wss, "nowPlaying").mockImplementation(mockedNowPlaying);

    await supertest(express).get(`/playables/${playable.id}/play`);

    expect(mockedNowPlaying).toHaveBeenCalledWith({ title: playable.title });
  });
});
