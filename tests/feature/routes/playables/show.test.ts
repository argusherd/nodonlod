import express from "@/routes";
import dayjs from "dayjs";
import supertest from "supertest";
import { createPlayable } from "../../setup/create-playable";

describe("The playable show page", () => {
  it("can only be accessed with an existing playable", async () => {
    await supertest(express).get("/playables/NOT_EXISTS").expect(404);
  });

  it("displays the properties of the playable", async () => {
    const playable = await createPlayable({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      title: "My title",
      duration: 123,
      description: "My description",
      thumbnail: "https://foo.com/bar.jpg",
      uploadDate: new Date("1995-01-01"),
    });

    await supertest(express)
      .get(`/playables/${playable.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(
          "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        );
        expect(res.text).toContain("My title");
        expect(res.text).toContain("00:02:03");
        expect(res.text).toContain("My description");
        expect(res.text).toContain("https://foo.com/bar.jpg");
        expect(res.text).toContain("1995-01-01");
        expect(res.text).toContain(
          dayjs(playable.createdAt).format("YYYY-MM-DD HH:mm:ss"),
        );
        expect(res.text).toContain(
          dayjs(playable.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
        );
      });
  });

  it("does not attempt to format the upload date if there isn't one", async () => {
    const playable = await createPlayable();

    await supertest(express)
      .get(`/playables/${playable.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).not.toContain("Invalid Date");
      });
  });
});
