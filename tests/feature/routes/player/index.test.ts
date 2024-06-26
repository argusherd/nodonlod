import express from "@/routes";
import mediaPlayer from "@/src/media-player";
import supertest from "supertest";

describe("The media player hook route", () => {
  it("can tell the player to pause the media", async () => {
    const mockedPause = jest.spyOn(mediaPlayer, "pause").mockImplementation();

    await supertest(express)
      .put("/player/pause")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain('id="play-btn"');
        expect(res.text).toContain("/player/resume");
      });

    expect(mockedPause).toHaveBeenCalled();
  });

  it("can tell the player to resume the media", async () => {
    const mockedResume = jest.spyOn(mediaPlayer, "resume").mockImplementation();

    await supertest(express)
      .put("/player/resume")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain('id="play-btn"');
        expect(res.text).toContain("/player/pause");
      });

    expect(mockedResume).toHaveBeenCalled();
  });

  it("can tell the player to stop the media", async () => {
    const mockedStop = jest.spyOn(mediaPlayer, "stop").mockImplementation();

    await supertest(express).put("/player/stop").expect(204);

    expect(mockedStop).toHaveBeenCalled();
  });

  it("can instruct the player to seek a specific time", async () => {
    const mockedSeek = jest.spyOn(mediaPlayer, "seek").mockImplementation();

    await supertest(express)
      .put("/player/seek")
      .type("form")
      .send({ seek: 10 })
      .expect(204);

    expect(mockedSeek).toHaveBeenCalledWith(10);
  });

  it("can instruct the player to replay the media", async () => {
    const mockedReplay = jest.spyOn(mediaPlayer, "replay").mockImplementation();

    await supertest(express).put("/player/replay").expect(204);

    expect(mockedReplay).toHaveBeenCalled();
  });
});
