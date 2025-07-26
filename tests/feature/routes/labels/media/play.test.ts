import express from "@/routes";
import mediaPlayer from "@/src/media-player";
import supertest from "supertest";
import { createLabel, createMedium } from "../../../setup/create-model";

describe("The label medium play route", () => {
  it("instructs the media player to play the given medium", async () => {
    const label = await createLabel();
    const medium = await createMedium();
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await label.$add("medium", medium);

    await supertest(express)
      .get(`/labels/${label.id}/media/${medium.id}/play`)
      .expect(200);

    expect(mockedPlay).toHaveBeenCalledWith(medium.url);
  });

  it("displays the current medium and the next playable medium", async () => {
    const label = await createLabel();
    const medium1 = await createMedium({
      title: "bar",
      thumbnail: "https://foo.com/bar.jpg",
    });
    const medium2 = await createMedium({ title: "foo" });

    await label.$add("medium", [medium1, medium2]);

    await supertest(express)
      .get(`/labels/${label.id}/media/${medium1.id}/play`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain("https://foo.com/bar.jpg");
        expect(res.text).toContain(
          `/labels/${label.id}/media/${medium2.id}/play`,
        );
      });
  });

  it("displays the first medium if the current medium is already the last one based on sorting", async () => {
    const label = await createLabel();
    const firstMedium = await createMedium({ title: "a" });
    const middleMedium = await createMedium({ title: "b" });
    const lastMedium = await createMedium({ title: "c" });

    await label.$add("medium", [firstMedium, middleMedium, lastMedium]);

    await supertest(express)
      .get(`/labels/${label.id}/media/${lastMedium.id}/play`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(
          `/labels/${label.id}/media/${firstMedium.id}/play`,
        );
      });
  });
});
