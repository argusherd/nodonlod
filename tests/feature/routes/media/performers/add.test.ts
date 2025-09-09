import express from "@/routes";
import dayjs from "dayjs";
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

  it("can search performers by name or description", async () => {
    const medium = await createMedium();
    const performer1 = await createPerformer({ name: "as foo 1" });
    const performer2 = await createPerformer({ description: "as bar 2" });

    await supertest(express)
      .get(`/media/${medium.id}/performers/add`)
      .query({ search: "foo" })
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(performer1.id);
        expect(res.text).not.toContain(performer2.id);
      });

    await supertest(express)
      .get(`/media/${medium.id}/performers/add`)
      .query({ search: "bar" })
      .expect(200)
      .expect((res) => {
        expect(res.text).not.toContain(performer1.id);
        expect(res.text).toContain(performer2.id);
      });
  });

  it("can sort the list based on other columns in ascending or descending order", async () => {
    const medium = await createMedium();
    const earlier = await createPerformer({
      createdAt: dayjs().subtract(1, "hour").toDate(),
      name: "foo",
    });
    const later = await createPerformer({ name: "bar" });

    await supertest(express)
      .get(`/media/${medium.id}/performers/add?sort=name`)
      .expect((res) => {
        const inOreder = new RegExp(`${earlier.id}.*${later.id}`);

        expect(inOreder.test(res.text)).toBeTruthy();
      });

    await supertest(express)
      .get(`/media/${medium.id}/performers/add?sort=name&sortBy=asc`)
      .expect((res) => {
        const inOreder = new RegExp(`${later.id}.*${earlier.id}`);

        expect(inOreder.test(res.text)).toBeTruthy();
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
