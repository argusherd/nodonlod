import express from "@/routes";
import dayjs from "dayjs";
import supertest from "supertest";
import { createLabel, createPerformer } from "../../../setup/create-model";

describe("The label performer add route", () => {
  it("lists all available performers", async () => {
    const label = await createLabel();
    const performer1 = await createPerformer();
    const performer2 = await createPerformer();

    await supertest(express)
      .get(`/labels/${label.id}/performers/add`)
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(performer1.name);
        expect(res.text).toContain(
          `/labels/${label.id}/performers/${performer1.id}`,
        );
        expect(res.text).toContain(performer2.name);
        expect(res.text).toContain(
          `/labels/${label.id}/performers/${performer2.id}`,
        );
      });
  });

  it("can search performers by name or description", async () => {
    const label = await createLabel();
    const performer1 = await createPerformer({ name: "as foo 1" });
    const performer2 = await createPerformer({ description: "as bar 2" });

    await supertest(express)
      .get(`/labels/${label.id}/performers/add`)
      .query({ search: "foo" })
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(performer1.id);
        expect(res.text).not.toContain(performer2.id);
      });

    await supertest(express)
      .get(`/labels/${label.id}/performers/add`)
      .query({ search: "bar" })
      .expect(200)
      .expect((res) => {
        expect(res.text).not.toContain(performer1.id);
        expect(res.text).toContain(performer2.id);
      });
  });

  it("can sort the list based on other columns in ascending or descending order", async () => {
    const label = await createLabel();
    const earlier = await createPerformer({
      createdAt: dayjs().subtract(1, "hour").toDate(),
      name: "foo",
    });
    const later = await createPerformer({ name: "bar" });

    await supertest(express)
      .get(`/labels/${label.id}/performers/add?sort=name`)
      .expect((res) => {
        const inOreder = new RegExp(`${earlier.id}.*${later.id}`);

        expect(inOreder.test(res.text)).toBeTruthy();
      });

    await supertest(express)
      .get(`/labels/${label.id}/performers/add?sort=name&sortBy=asc`)
      .expect((res) => {
        const inOreder = new RegExp(`${later.id}.*${earlier.id}`);

        expect(inOreder.test(res.text)).toBeTruthy();
      });
  });

  it("creates the relationship between the performer and the label", async () => {
    const label = await createLabel();
    const performer = await createPerformer();

    await supertest(express)
      .post(`/labels/${label.id}/performers/${performer.id}`)
      .expect(205)
      .expect((res) => {
        expect(res.headers["hx-trigger"]).toContain("close-modal");
        expect(res.headers["hx-trigger"]).toContain("refresh-performers");
      });

    expect(await label.$count("performers")).toEqual(1);
  });
});
