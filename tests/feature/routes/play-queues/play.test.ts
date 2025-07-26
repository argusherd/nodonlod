import express from "@/routes";
import mediaPlayer from "@/src/media-player";
import supertest from "supertest";
import {
  createChapter,
  createMedium,
  createPlayQueue,
} from "../../setup/create-model";

describe("The play the item in the play queue route", () => {
  it("instructs the application to play the item in the play queue", async () => {
    const medium = await createMedium();
    const chapter = await createChapter({
      mediumId: medium.id,
      startTime: 10,
      endTime: 20,
    });
    const playQueue = await createPlayQueue({
      mediumId: medium.id,
      chapterId: chapter.id,
    });
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await supertest(express)
      .get(`/play-queues/${playQueue.id}/play`)
      .expect(200);

    expect(mockedPlay).toHaveBeenCalledWith(medium.url, 10, 20);
  });

  it("displays the current item and next item in the play queue", async () => {
    const medium1 = await createMedium();
    const medium2 = await createMedium();
    const playQueue1 = await createPlayQueue({
      mediumId: medium1.id,
      order: 1,
    });
    const playQueue2 = await createPlayQueue({
      mediumId: medium2.id,
      order: 2,
    });

    await supertest(express)
      .get(`/play-queues/${playQueue1.id}/play`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`/media/${medium1.id}`);
        expect(res.text).toContain(`/play-queues/${playQueue2.id}/play`);
      });
  });

  it("displays the first item if the current item is already the last one", async () => {
    const firstQueue = await createPlayQueue({ order: 1 });
    await createPlayQueue({ order: 2 });
    const lastQueue = await createPlayQueue({ order: 3 });

    await supertest(express)
      .get(`/play-queues/${lastQueue.id}/play`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`/play-queues/${firstQueue.id}/play`);
      });
  });
});
