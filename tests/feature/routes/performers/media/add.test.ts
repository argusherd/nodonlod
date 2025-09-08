import express from "@/routes";
import dayjs from "dayjs";
import supertest from "supertest";
import { createMedium, createPerformer } from "../../../setup/create-model";

describe("The performer medium add route", () => {
  it("has a dedicated add page", async () => {
    const performer = await createPerformer();
    const medium1 = await createMedium();
    const medium2 = await createMedium();

    await supertest(express)
      .get(`/performers/${performer.id}/media/add`)
      .expect(200)
      .expect("hx-trigger", "open-modal")
      .expect((res) => {
        expect(res.text).toContain(
          `/performers/${performer.id}/media/${medium1.id}`,
        );
        expect(res.text).toContain(
          `/performers/${performer.id}/media/${medium2.id}`,
        );
        expect(res.text).toContain(medium1.title);
        expect(res.text).toContain(medium2.title);
      });
  });

  it("can filter available media by title or description", async () => {
    const performer = await createPerformer();
    const medium1 = await createMedium({ title: "foo" });
    const medium2 = await createMedium({ title: "bar", description: "baz" });

    await supertest(express)
      .get(`/performers/${performer.id}/media/add?search=${medium1.title}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(medium1.id);
        expect(res.text).not.toContain(medium2.id);
      });

    await supertest(express)
      .get(`/performers/${performer.id}/media/add?search=baz`)
      .expect(200)
      .expect((res) => {
        expect(res.text).not.toContain(medium1.id);
        expect(res.text).toContain(medium2.id);
      });
  });

  it("can sort the list based on other columns in ascending or descending order", async () => {
    const performer = await createPerformer();
    const earlier = await createMedium({
      createdAt: dayjs().subtract(1, "hour").toDate(),
      title: "foo",
    });
    const later = await createMedium({ title: "bar" });

    await supertest(express)
      .get(`/performers/${performer.id}/media/add?sort=title`)
      .expect((res) => {
        const inOreder = new RegExp(`${earlier.id}.*${later.id}`);

        expect(inOreder.test(res.text)).toBeTruthy();
      });

    await supertest(express)
      .get(`/performers/${performer.id}/media/add?sort=title&sortBy=asc`)
      .expect((res) => {
        const inOreder = new RegExp(`${later.id}.*${earlier.id}`);

        expect(inOreder.test(res.text)).toBeTruthy();
      });
  });

  it("displays the medium's performers", async () => {
    const performer = await createPerformer();
    const medium = await createMedium();
    const performer1 = await createPerformer();
    const performer2 = await createPerformer();

    await medium.$add("performer", [performer1, performer2]);

    await supertest(express)
      .get(`/performers/${performer.id}/media/add`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(performer1.name);
        expect(res.text).toContain(performer2.name);
        expect(res.text).toContain(`/performers/${performer1.id}`);
        expect(res.text).toContain(`/performers/${performer2.id}`);
      });
  });

  it("distinguishes the media count with associations", async () => {
    const performer = await createPerformer();
    const medium1 = await createMedium();
    const medium2 = await createMedium();
    const performer1 = await createPerformer();
    const performer2 = await createPerformer();
    const performer3 = await createPerformer();

    await medium1.$add("performer", [performer1, performer2]);
    await medium2.$add("performer", [performer3]);

    await supertest(express)
      .get(`/performers/${performer.id}/media/add`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`1-2 (2)`);
      });
  });
});
