import express from "@/routes";
import mediaPlayer from "@/src/media-player";
import supertest from "supertest";

describe("The media player hook route", () => {
  it("can tell the player to pause the media", async () => {
    const mockedPause = jest.spyOn(mediaPlayer, "pause").mockImplementation();

    await supertest(express).put("/player/pause").expect(204);

    expect(mockedPause).toHaveBeenCalled();
  });

  it("can tell the player to resume the media", async () => {
    const mockedResume = jest.spyOn(mediaPlayer, "resume").mockImplementation();

    await supertest(express).put("/player/resume").expect(204);

    expect(mockedResume).toHaveBeenCalled();
  });
});
