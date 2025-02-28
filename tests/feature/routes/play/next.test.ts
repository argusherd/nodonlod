import express from "@/routes";
import * as playModule from "@/src/currently-playing";
import mediaPlayer from "@/src/media-player";
import dayjs from "dayjs";
import supertest from "supertest";
import {
  createMedium,
  createPlayQueue,
  createPlaylistable,
} from "../../setup/create-model";

describe("The play next route", () => {
  it("determines whether the currently playing item is the last one in the list", async () => {
    await createMedium();
    await createMedium({
      createdAt: dayjs().subtract(1, "day").toDate(),
    });

    jest.spyOn(mediaPlayer, "play").mockImplementation();

    await supertest(express)
      .put("/play/next")
      .expect(205)
      .expect((res) => {
        expect(res.headers["hx-trigger"]).toContain("not-last-one");
      });

    await supertest(express)
      .put("/play/next")
      .expect(205)
      .expect((res) => {
        expect(res.headers["hx-trigger"]).toContain("last-one-played");
      });
  });

  it("plays the next medium in the database by default", async () => {
    const mockedPlayNextMedium = jest
      .spyOn(playModule, "playNextMedium")
      .mockImplementation();

    await supertest(express)
      .put("/play/next")
      .expect(205)
      .expect((res) => {
        expect(res.headers["hx-trigger"]).toContain("show-playing");
      });

    expect(mockedPlayNextMedium).toHaveBeenCalled();
  });

  it("plays the next item when an item from a playlist is currently playing", async () => {
    playModule.currentlyPlaying.playlistable = await createPlaylistable();

    const mockedPlayNextPlaylistable = jest
      .spyOn(playModule, "playNextPlaylistable")
      .mockImplementation();

    await supertest(express).put("/play/next").expect(205);

    expect(mockedPlayNextPlaylistable).toHaveBeenCalled();
  });

  it("plays the next item when an item from the play queue is currently playing", async () => {
    playModule.currentlyPlaying.playlistable = null;
    playModule.currentlyPlaying.playQueue = await createPlayQueue();

    const mockedPlayNextQueued = jest
      .spyOn(playModule, "playNextQueued")
      .mockImplementation();

    await supertest(express).put("/play/next").expect(205);

    expect(mockedPlayNextQueued).toHaveBeenCalled();
  });

  it("plays the next random medium when a parameter is specified", async () => {
    const mockedPlayNextRandom = jest
      .spyOn(playModule, "playNextRandom")
      .mockImplementation();

    await supertest(express)
      .put("/play/next")
      .type("form")
      .send({ isRandom: true })
      .expect(205);

    expect(mockedPlayNextRandom).toHaveBeenCalled();
  });
});
