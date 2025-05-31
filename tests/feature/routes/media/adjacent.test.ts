import express from "@/routes";
import dayjs from "dayjs";
import supertest from "supertest";
import { createMedium } from "../../setup/create-model";

describe("The medium adjacent route", () => {
  it("displays previous medium and next medium of the current medium based on createdAt column in descending order", async () => {
    const first = await createMedium({
      createdAt: dayjs().add(1, "day").toDate(),
    });
    const previous = await createMedium({
      createdAt: dayjs().add(1, "hour").toDate(),
    });
    const medium = await createMedium();
    const next = await createMedium({
      createdAt: dayjs().subtract(1, "hour").toDate(),
    });
    const last = await createMedium({
      createdAt: dayjs().subtract(1, "day").toDate(),
    });

    const descendingOrder = new RegExp(`${previous.id}.*${next.id}`);

    await supertest(express)
      .get(`/media/${medium.id}/adjacent`)
      .expect(200)
      .expect((res) => {
        expect(descendingOrder.test(res.text)).toBeTruthy();
        expect(res.text).toContain(`/media/${previous.id}`);
        expect(res.text).toContain(`/media/${next.id}`);
        expect(res.text).not.toContain(`/media/${last.id}`);
        expect(res.text).not.toContain(`/media/${first.id}`);
      });
  });

  it("can reverse the previous and next mediums in ascending order", async () => {
    const first = await createMedium({
      createdAt: dayjs().add(1, "day").toDate(),
    });
    const previous = await createMedium({
      createdAt: dayjs().add(1, "hour").toDate(),
    });
    const medium = await createMedium();
    const next = await createMedium({
      createdAt: dayjs().subtract(1, "hour").toDate(),
    });
    const last = await createMedium({
      createdAt: dayjs().subtract(1, "day").toDate(),
    });

    const descendingOrder = new RegExp(`${next.id}.*${previous.id}`);

    await supertest(express)
      .get(`/media/${medium.id}/adjacent?sortBy=asc`)
      .expect(200)
      .expect((res) => {
        expect(descendingOrder.test(res.text)).toBeTruthy();
        expect(res.text).toContain(`/media/${previous.id}?sortBy=asc`);
        expect(res.text).toContain(`/media/${next.id}?sortBy=asc`);
        expect(res.text).not.toContain(`/media/${last.id}`);
        expect(res.text).not.toContain(`/media/${first.id}`);
      });
  });

  it("displays the first medium if the current medium is the last one", async () => {
    const first = await createMedium({
      createdAt: dayjs().add(1, "day").toDate(),
    });
    const previous = await createMedium({
      createdAt: dayjs().add(1, "hour").toDate(),
    });
    const medium = await createMedium();
    const next = await createMedium({
      createdAt: dayjs().subtract(1, "hour").toDate(),
    });
    const last = await createMedium({
      createdAt: dayjs().subtract(1, "day").toDate(),
    });

    await supertest(express)
      .get(`/media/${last.id}/adjacent`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`/media/${next.id}`);
        expect(res.text).toContain(`/media/${first.id}`);
        expect(res.text).not.toContain(`/media/${previous.id}`);
        expect(res.text).not.toContain(`/media/${medium.id}`);
      });
  });

  it("displays the last medium if the current medium is the first one", async () => {
    const first = await createMedium({
      createdAt: dayjs().add(1, "day").toDate(),
    });
    const previous = await createMedium({
      createdAt: dayjs().add(1, "hour").toDate(),
    });
    const medium = await createMedium();
    const next = await createMedium({
      createdAt: dayjs().subtract(1, "hour").toDate(),
    });
    const last = await createMedium({
      createdAt: dayjs().subtract(1, "day").toDate(),
    });

    await supertest(express)
      .get(`/media/${first.id}/adjacent`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`/media/${previous.id}`);
        expect(res.text).toContain(`/media/${last.id}`);
        expect(res.text).not.toContain(`/media/${next.id}`);
        expect(res.text).not.toContain(`/media/${medium.id}`);
      });
  });

  it("can change the sorting column", async () => {
    const first = await createMedium({ duration: 5 });
    const previous = await createMedium({ duration: 4 });
    const medium = await createMedium({ duration: 3 });
    const next = await createMedium({ duration: 2 });
    const last = await createMedium({ duration: 1 });

    await supertest(express)
      .get(`/media/${medium.id}/adjacent?sort=duration`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`/media/${previous.id}?sort=duration`);
        expect(res.text).toContain(`/media/${next.id}?sort=duration`);
        expect(res.text).not.toContain(`/media/${last.id}`);
        expect(res.text).not.toContain(`/media/${first.id}`);
      });
  });
});
