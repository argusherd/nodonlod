import express from "@/routes";
import mediaPlayer from "@/src/media-player";
import dayjs from "dayjs";
import supertest from "supertest";
import { createMedium, createPerformer } from "../../../setup/create-model";

describe("The performer medium play route", () => {
  it("instructs the media player to play the given medium", async () => {
    const performer = await createPerformer();
    const medium = await createMedium();

    await performer.$add("medium", medium);

    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await supertest(express)
      .get(`/performers/${performer.id}/media/${medium.id}/play`)
      .expect(200);

    expect(mockedPlay).toHaveBeenCalledWith(medium.url);
  });

  it("displays the current medium and the next playable medium", async () => {
    const performer = await createPerformer();
    const medium1 = await createMedium({
      thumbnail: "https://foo.com/bar.jpg",
    });
    const medium2 = await createMedium();

    await performer.$add("medium", [medium1, medium2]);

    await supertest(express)
      .get(`/performers/${performer.id}/media/${medium1.id}/play`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain("https://foo.com/bar.jpg");
        expect(res.text).toContain(
          `/performers/${performer.id}/media/${medium2.id}/play`,
        );
      });
  });

  it("displays the first medium if the current medium is already the last one based on sorting", async () => {
    const performer = await createPerformer();
    const firstMedium = await createMedium({
      createdAt: dayjs().subtract(1, "day").toDate(),
    });
    const middleMedium = await createMedium();
    const lastMedium = await createMedium({
      createdAt: dayjs().add(1, "day").toDate(),
    });

    await performer.$add("medium", [firstMedium, middleMedium, lastMedium]);

    await supertest(express)
      .get(`/performers/${performer.id}/media/${lastMedium.id}/play`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(
          `/performers/${performer.id}/media/${firstMedium.id}/play`,
        );
      });
  });
});
