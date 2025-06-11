import express from "@/routes";
import dayjs from "dayjs";
import supertest from "supertest";
import { createPerformer } from "../../setup/create-model";

describe("The performer index page", () => {
  it("lists the names and thumbnails of the performers", async () => {
    const performer1 = await createPerformer();
    const performer2 = await createPerformer();

    await supertest(express)
      .get("/performers")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(performer1.name);
        expect(res.text).toContain(performer2.name);
        expect(res.text).toContain(performer1.thumbnail);
        expect(res.text).toContain(performer2.thumbnail);
        expect(res.text).toContain(`/performers/${performer1.id}`);
        expect(res.text).toContain(`/performers/${performer2.id}`);
      });
  });

  it("displays 10 results per page and sorts them by createdAt in descending order", async () => {
    const earliest = await createPerformer({
      createdAt: dayjs().subtract(3, "hour").toDate(),
    });
    const earlier = await createPerformer({
      createdAt: dayjs().subtract(1, "hour").toDate(),
    });
    const later = await createPerformer({
      createdAt: dayjs().add(1, "hour").toDate(),
    });
    const latest = await createPerformer({
      createdAt: dayjs().add(3, "hour").toDate(),
    });

    await supertest(express)
      .get("/performers")
      .expect(200)
      .expect((res) => {
        const inOrder = new RegExp(
          `${latest.id}.*${later.id}.*${earlier}.*${earliest.id}`,
          "s",
        );

        expect(inOrder.test(res.text)).toBeTruthy();
      });
  });

  it("can sort the list by other columns in ascending or descending order", async () => {
    const performer1 = await createPerformer({ name: "foo" });
    const performer2 = await createPerformer({ name: "bar" });

    await supertest(express)
      .get("/performers?sort=name&sortBy=asc")
      .expect(200)
      .expect((res) => {
        const inOrder = new RegExp(`${performer2.id}.*${performer1.id}`, "s");

        expect(inOrder.test(res.text)).toBeTruthy();
      });

    await supertest(express)
      .get("/performers?sort=name&sortBy=desc")
      .expect(200)
      .expect((res) => {
        const inOrder = new RegExp(`${performer1.id}.*${performer2.id}`, "s");

        expect(inOrder.test(res.text)).toBeTruthy();
      });
  });

  it("can search the name or the decription", async () => {
    const performer1 = await createPerformer({ name: "foo" });
    const performer2 = await createPerformer({
      name: "foo2",
      description: "bar",
    });

    await supertest(express)
      .get("/performers?search=foo")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(performer1.id);
        expect(res.text).toContain(performer2.id);
      });

    await supertest(express)
      .get("/performers?search=bar")
      .expect(200)
      .expect((res) => {
        expect(res.text).not.toContain(performer1.id);
        expect(res.text).toContain(performer2.id);
      });

    await supertest(express)
      .get("/performers?search=baz")
      .expect(200)
      .expect((res) => {
        expect(res.text).not.toContain(performer1.id);
        expect(res.text).not.toContain(performer2.id);
      });
  });
});
