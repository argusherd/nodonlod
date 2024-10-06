import Chapter from "@/database/models/chapter";
import express from "@/routes";
import * as playModule from "@/src/currently-playing";
import supertest from "supertest";
import { createChapter } from "../../setup/create-model";

describe("The chapter play route", () => {
  it("instructs the application to play the chapter of a medium", async () => {
    await createChapter({
      startTime: 10,
      endTime: 30,
    });

    const chapter = await Chapter.findOne();
    const mockedPlay = jest.spyOn(playModule, "play").mockImplementation();

    await supertest(express)
      .get(`/chapters/${chapter?.id}/play`)
      .expect(202)
      .expect("HX-Trigger", "show-playing");

    expect(mockedPlay).toHaveBeenCalledWith(chapter);
  });
});
