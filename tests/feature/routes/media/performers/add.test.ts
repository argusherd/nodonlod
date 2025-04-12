import express from "@/routes";
import supertest from "supertest";
import { createMedium, createPerformer } from "../../../setup/create-model";

describe("The medium performer add route", () => {
  it("lists all available performers", async () => {
    const medium = await createMedium();
    const performer1 = await createPerformer();
    const performer2 = await createPerformer();

    await supertest(express)
      .get(`/media/${medium.id}/performers/add`)
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(performer1.name);
        expect(res.text).toContain(
          `/media/${medium.id}/performers/${performer1.id}`,
        );
        expect(res.text).toContain(performer2.name);
        expect(res.text).toContain(
          `/media/${medium.id}/performers/${performer2.id}`,
        );
      });
  });

  it("can filter performers by name", async () => {
    const medium = await createMedium();
    const performer1 = await createPerformer();
    const performer2 = await createPerformer();

    await supertest(express)
      .get(`/media/${medium.id}/performers/add`)
      .query({ name: performer2.name })
      .expect(200)
      .expect((res) => {
        expect(res.text).not.toContain(performer1.name);
        expect(res.text).not.toContain(
          `/media/${medium.id}/performers/${performer1.id}`,
        );
        expect(res.text).toContain(performer2.name);
        expect(res.text).toContain(
          `/media/${medium.id}/performers/${performer2.id}`,
        );
      });
  });

  it("creates the relationship between the performer and the medium", async () => {
    const medium = await createMedium();
    const performer = await createPerformer();

    await supertest(express)
      .post(`/media/${medium.id}/performers/${performer.id}`)
      .expect(205);

    expect(await medium.$count("performers")).toEqual(1);
  });
});
