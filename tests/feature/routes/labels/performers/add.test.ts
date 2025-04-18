import express from "@/routes";
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

  it("can filter performers by name", async () => {
    const label = await createLabel();
    const performer1 = await createPerformer();
    const performer2 = await createPerformer();

    await supertest(express)
      .get(`/labels/${label.id}/performers/add`)
      .query({ name: performer2.name })
      .expect(200)
      .expect((res) => {
        expect(res.text).not.toContain(performer1.name);
        expect(res.text).not.toContain(
          `/labels/${label.id}/performers/${performer1.id}`,
        );
        expect(res.text).toContain(performer2.name);
        expect(res.text).toContain(
          `/labels/${label.id}/performers/${performer2.id}`,
        );
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
