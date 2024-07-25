import Chapter from "@/database/models/chapter";
import Medium from "@/database/models/medium";
import express from "@/routes";
import wss from "@/routes/websocket";
import mediaPlayer from "@/src/media-player";
import supertest from "supertest";
import { createChapter, createMedium } from "../../setup/create-model";

describe("The chapter play route", () => {
  it("instructs the media player to play the chapter", async () => {
    const medium = await createMedium();
    const chapter = await createChapter({
      mediumId: medium.id,
      startTime: 10,
      endTime: 30,
    });
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await supertest(express).get(`/chapters/${chapter.id}/play`).expect(202);

    expect(mockedPlay).toHaveBeenCalledWith(medium.url, 10, 30);
  });

  it("also instruct the websocket to send out the medium information", async () => {
    const medium = await createMedium();
    const chapter = await createChapter({
      mediumId: medium.id,
      startTime: 10,
      endTime: 30,
    });
    const mockedNowPlaying = jest.spyOn(wss, "nowPlaying").mockImplementation();

    await supertest(express).get(`/chapters/${chapter.id}/play`).expect(202);

    expect(mockedNowPlaying).toHaveBeenCalledWith(
      await Medium.findOne({ where: { id: medium.id } }),
      await Chapter.findOne({ where: { id: chapter.id } }),
    );
  });
});
