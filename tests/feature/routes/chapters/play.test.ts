import express from "@/routes";
import mediaPlayer from "@/src/media-player";
import supertest from "supertest";
import { createChapter, createMedium } from "../../setup/create-model";

describe("The chapter play route", () => {
  it("instructs the application to play the chapter of a medium", async () => {
    const medium = await createMedium();
    const chapter = await createChapter({
      mediumId: medium.id,
      startTime: 10,
      endTime: 30,
    });

    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await supertest(express).get(`/chapters/${chapter.id}/play`).expect(200);

    expect(mockedPlay).toHaveBeenCalledWith(medium.url, 10, 30);
  });

  it("displays the title and the related medium from the current chapter", async () => {
    const medium = await createMedium({ thumbnail: "https://foo.com/bar.jpg" });
    const chapter = await createChapter({
      mediumId: medium.id,
      title: "my chapter",
      startTime: 10,
      endTime: 30,
    });

    await supertest(express)
      .get(`/chapters/${chapter.id}/play`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain("https://foo.com/bar.jpg");
        expect(res.text).toContain("my chapter");
        expect(res.text).toContain(`/media/${medium.id}/chapters`);
      });
  });

  it("displays the next chapter you can play", async () => {
    const medium = await createMedium();
    const chapter1 = await createChapter({
      mediumId: medium.id,
      startTime: 10,
    });
    const chapter2 = await createChapter({
      mediumId: medium.id,
      startTime: 30,
    });

    await supertest(express)
      .get(`/chapters/${chapter1.id}/play`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`/chapters/${chapter2.id}/play`);
      });
  });

  it("gives the first chapter if the current chapter is the last one", async () => {
    const medium = await createMedium();
    const chapter1 = await createChapter({
      mediumId: medium.id,
      startTime: 10,
    });
    const chapter2 = await createChapter({
      mediumId: medium.id,
      startTime: 30,
    });

    await supertest(express)
      .get(`/chapters/${chapter2.id}/play`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`/chapters/${chapter1.id}/play`);
      });
  });
});
