import express from "@/routes";
import { play } from "@/routes/play";
import mediaPlayer from "@/src/media-player";
import supertest from "supertest";
import { createMedium } from "../../setup/create-model";

describe("The show play route", () => {
  it("displays the currently playing medium", async () => {
    const medium = await createMedium({ description: "foo" });

    jest.spyOn(mediaPlayer, "play").mockImplementation(jest.fn());

    await play(medium);

    await supertest(express)
      .get("/play")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(medium.title);
        expect(res.text).toContain(medium.description);
        expect(res.text).toContain(`/media/${medium.id}`);
      });
  });
});
