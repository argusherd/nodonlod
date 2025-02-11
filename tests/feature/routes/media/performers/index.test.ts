import express from "@/routes";
import supertest from "supertest";
import { createMedium, createPerformer } from "../../../setup/create-model";

describe("The medium performer index page", () => {
  it("lists all performers associated with the medium", async () => {
    const medium = await createMedium();
    const performer1 = await createPerformer();
    const performer2 = await createPerformer();

    await medium.$add("performer", performer1);

    await supertest(express)
      .get(`/media/${medium.id}/performers`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(performer1.name);
        expect(res.text).toContain(
          `/media/${medium.id}/performers/${performer1.id}`,
        );
        expect(res.text).not.toContain(performer2.name);
        expect(res.text).not.toContain(
          `/media/${medium.id}/performers/${performer2.id}`,
        );
      });
  });
});
