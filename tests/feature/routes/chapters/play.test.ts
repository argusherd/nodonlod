import express from "@/routes";
import wss from "@/routes/websocket";
import mediaPlayer from "@/src/media-player";
import supertest from "supertest";
import { createChapter, createPlayable } from "../../setup/create-model";

describe("The chapter play route", () => {
  it("instructs the media player to play the chapter", async () => {
    const playable = await createPlayable();
    const chapter = await createChapter({
      playableId: playable.id,
      startTime: 10,
      endTime: 30,
    });
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await supertest(express).get(`/chapters/${chapter.id}/play`).expect(202);

    expect(mockedPlay).toHaveBeenCalledWith(playable.url, 10, 30);
  });

  it("also instruct the websocket to send out the playable information", async () => {
    const playable = await createPlayable();
    const chapter = await createChapter({
      playableId: playable.id,
      startTime: 10,
      endTime: 30,
    });
    const mockedNowPlaying = jest.spyOn(wss, "nowPlaying").mockImplementation();

    await supertest(express).get(`/chapters/${chapter.id}/play`).expect(202);

    expect(mockedNowPlaying).toHaveBeenCalledWith({
      title: playable.title,
      chapter: chapter.title,
      startTime: 10,
      endTime: 30,
    });
  });
});
