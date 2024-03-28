import express from "@/routes";
import mediaPlayer from "@/src/media-player";
import supertest from "supertest";
import { createPlayable } from "../../setup/create-playable";

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
});
