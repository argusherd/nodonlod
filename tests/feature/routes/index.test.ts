import express from "@/routes";
import dayjs from "dayjs";
import { app } from "electron";
import supertest from "supertest";
import {
  createMedium,
  createPerformer,
  createPlaylist,
} from "../setup/create-model";

describe("The home route", () => {
  it("displays the items created in the last 7 days", async () => {
    const medium1 = await createMedium();
    const medium2 = await createMedium({
      createdAt: dayjs().subtract(8, "d").toDate(),
    });
    const playlist1 = await createPlaylist();
    const playlist2 = await createPlaylist({
      createdAt: dayjs().subtract(8, "d").toDate(),
    });
    const performer1 = await createPerformer();
    const performer2 = await createPerformer({
      createdAt: dayjs().subtract(8, "d").toDate(),
    });

    await supertest(express)
      .get("/")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(medium1.title);
        expect(res.text).toContain(playlist1.title);
        expect(res.text).toContain(performer1.name);
        expect(res.text).not.toContain(medium2.title);
        expect(res.text).not.toContain(playlist2.title);
        expect(res.text).not.toContain(performer2.name);
      });
  });

  it("displays the items in descending order based on the createdAt column", async () => {
    const medium = await createMedium();
    const playlist = await createPlaylist({
      createdAt: dayjs().subtract(1, "d").toDate(),
    });

    await supertest(express)
      .get("/")
      .expect(200)
      .expect((res) => {
        const inOrder = new RegExp(`${medium.id}.*${playlist.id}`, "s");

        expect(inOrder.test(res.text)).toBeTruthy();
      });
  });

  it("groups items into different sections", async () => {
    const justNow = await createMedium();
    const in1Hour = await createMedium({
      createdAt: dayjs().subtract(10, "m").toDate(),
    });

    await supertest(express)
      .get("/")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(justNow.id);
        expect(res.text).toContain(in1Hour.id);
        expect(res.text).toContain("Just now");
        expect(res.text).toContain("In an hour");
        expect(res.text).not.toContain("Today");
        expect(res.text).not.toContain("In the last week");
      });

    const today = await createMedium({
      createdAt: dayjs().subtract(10, "h").toDate(),
    });
    const inLastWeek = await createMedium({
      createdAt: dayjs().subtract(1, "d").toDate(),
    });

    await supertest(express)
      .get("/")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(today.id);
        expect(res.text).toContain(inLastWeek.id);
        expect(res.text).toContain("Today");
        expect(res.text).toContain("In the last week");
      });
  });

  it("displays the version of the app", async () => {
    jest.spyOn(app, "getVersion").mockReturnValue("4.2.0");

    await supertest(express)
      .get("/")
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain("4.2.0");
      });
  });
});
