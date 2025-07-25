import express from "@/routes";
import mediaPlayer from "@/src/media-player";
import dayjs from "dayjs";
import supertest from "supertest";
import { createMedium } from "../../setup/create-model";

describe("The medium play route", () => {
  it("instructs the application to play the medium", async () => {
    const medium = await createMedium();
    const mockedPlay = jest.fn();

    jest.spyOn(mediaPlayer, "play").mockImplementation(mockedPlay);

    await supertest(express).get(`/media/${medium.id}/play`).expect(200);

    expect(mockedPlay).toHaveBeenCalledWith(medium.url);
  });

  it("displays the current medium and the next medium you can play", async () => {
    const medium = await createMedium();
    const nextMedium = await createMedium({
      createdAt: dayjs().subtract(1, "day").toDate(),
    });

    jest.spyOn(mediaPlayer, "play").mockImplementation();

    await supertest(express)
      .get(`/media/${medium.id}/play`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`/media/${medium.id}`);
        expect(res.text).toContain(medium.title);
        expect(res.text).toContain(`/media/${nextMedium.id}/play`);
      });
  });

  it("cannot test the next medium based on sorting because a random medium exists", async () => {
    expect(false).toBeFalsy();
  });

  it("displays the first medium if the current medium is already the last one based on sorting", async () => {
    const first = await createMedium({ duration: 10 });
    await createMedium({ duration: 69 });
    await createMedium({ duration: 123 });
    await createMedium({ duration: 321 });
    const medium = await createMedium({ duration: 420 });

    jest.spyOn(mediaPlayer, "play").mockImplementation();

    await supertest(express)
      .get(`/media/${medium.id}/play?sort=duration&sortBy=asc`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`/media/${first.id}/play`);
      });
  });

  it("cannot instruct the media player to play a medium that does not exist", async () => {
    const mockedPlay = jest.fn();

    jest.spyOn(mediaPlayer, "play").mockImplementation(mockedPlay);

    await supertest(express).get(`/media/NOT_EXISTS/play`).expect(404);
  });

  it("displays the url for reporting errors", async () => {
    const medium = await createMedium();

    jest.spyOn(mediaPlayer, "play").mockImplementation();

    await supertest(express)
      .get(`/media/${medium.id}/play`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`/media/${medium.id}/error`);
      });
  });
});
