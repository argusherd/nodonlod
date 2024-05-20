import express from "@/routes";
import supertest from "supertest";
import { createPlayable } from "../../setup/create-model";

describe("The playable index page", () => {
  it("lists all playables and provides a link for each playable", async () => {
    const playable1 = await createPlayable();
    const playable2 = await createPlayable();

    await supertest(express)
      .get("/playables")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(playable1.title);
        expect(res.text).toContain(playable2.title);
        expect(res.text).toContain(`"/playables/${playable1.id}"`);
        expect(res.text).toContain(`"/playables/${playable2.id}"`);
        expect(res.text).toContain(`/playables/${playable2.id}/play`);
        expect(res.text).toContain(`/playables/${playable2.id}/play`);
      });
  });
});
