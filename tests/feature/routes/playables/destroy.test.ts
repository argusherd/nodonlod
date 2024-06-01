import Playable from "@/database/models/playable";
import express from "@/routes";
import supertest from "supertest";
import { createPlayable } from "../../setup/create-model";

describe("The destory playable route", () => {
  it("deletes the playable", async () => {
    const playable = await createPlayable();

    await supertest(express).delete(`/playables/${playable.id}`).expect(204);

    expect(await Playable.count()).toEqual(0);
  });
});
