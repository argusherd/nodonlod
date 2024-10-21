import express from "@/routes";
import mediaPlayer from "@/src/media-player";
import supertest from "supertest";

describe("The media player hook route", () => {
  it("can tell the player to pause the media", async () => {
    const mockedPause = jest.spyOn(mediaPlayer, "pause").mockImplementation();

    await supertest(express).put("/player/pause").expect(205);

    expect(mockedPause).toHaveBeenCalled();
  });

  it("can tell the player to resume the media", async () => {
    const mockedResume = jest.spyOn(mediaPlayer, "resume").mockImplementation();

    await supertest(express).put("/player/resume").expect(205);

    expect(mockedResume).toHaveBeenCalled();
  });

  it("can tell the player to stop the media", async () => {
    const mockedStop = jest.spyOn(mediaPlayer, "stop").mockImplementation();

    await supertest(express).put("/player/stop").expect(205);

    expect(mockedStop).toHaveBeenCalled();
  });

  it("can instruct the player to seek a specific time", async () => {
    const mockedSeek = jest.spyOn(mediaPlayer, "seek").mockImplementation();

    await supertest(express)
      .put("/player/seek")
      .type("form")
      .send({ seek: 10 })
      .expect(205);

    expect(mockedSeek).toHaveBeenCalledWith(10);
  });

  it("can instruct the player to replay the media", async () => {
    const mockedReplay = jest.spyOn(mediaPlayer, "replay").mockImplementation();

    await supertest(express).put("/player/replay").expect(205);

    expect(mockedReplay).toHaveBeenCalled();
  });

  it("can instruct the player to set the volume", async () => {
    const mockedVolume = jest.spyOn(mediaPlayer, "volume").mockImplementation();

    await supertest(express)
      .put("/player/volume")
      .type("form")
      .send({ volume: 69 })
      .expect(205);

    expect(mockedVolume).toHaveBeenCalledWith(69);
  });
});
