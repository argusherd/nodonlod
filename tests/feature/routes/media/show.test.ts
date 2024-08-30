import express from "@/routes";
import { formatSeconds } from "@/src/neat-duration";
import dayjs from "dayjs";
import supertest from "supertest";
import {
  createLabel,
  createMedium,
  createPlaylist,
  createTag,
  createUploader,
} from "../../setup/create-model";

describe("The medium show page", () => {
  it("can only be accessed with an existing medium", async () => {
    await supertest(express).get("/media/NOT_EXISTS").expect(404);
  });

  it("displays the properties of the medium", async () => {
    const medium = await createMedium({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      title: "My title",
      duration: 123,
      description: "My description",
      thumbnail: "https://foo.com/bar.jpg",
      uploadDate: new Date("1995-01-01"),
    });

    await supertest(express)
      .get(`/media/${medium.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(
          "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        );
        expect(res.text).toContain("My title");
        expect(res.text).toContain(formatSeconds(123));
        expect(res.text).toContain("My description");
        expect(res.text).toContain("https://foo.com/bar.jpg");
        expect(res.text).toContain("1995-01-01");
        expect(res.text).toContain(
          dayjs(medium.createdAt).format("YYYY-MM-DD HH:mm:ss"),
        );
        expect(res.text).toContain(
          dayjs(medium.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
        );
      });
  });

  it("does not attempt to format the upload date if there isn't one", async () => {
    const medium = await createMedium();

    await supertest(express)
      .get(`/media/${medium.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).not.toContain("Invalid Date");
      });
  });

  it("displays the uploader of the medium", async () => {
    const uploader = await createUploader();
    const medium = await createMedium({ uploaderId: uploader.id });

    await supertest(express)
      .get(`/media/${medium.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(uploader.name);
      });
  });

  it("displays all the chapters of the medium", async () => {
    const medium = await createMedium();

    const chapter1 = await medium.$create("chapter", {
      title: "ep1",
      startTime: 10,
      endTime: 30,
    });
    const chapter2 = await medium.$create("chapter", { title: "ep2" });

    await supertest(express)
      .get(`/media/${medium.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain("ep1");
        expect(res.text).toContain(formatSeconds(10));
        expect(res.text).toContain(formatSeconds(30));
        expect(res.text).toContain("ep2");
        expect(res.text).toContain(`/chapters/${chapter1.id}/play`);
        expect(res.text).toContain(`/chapters/${chapter2.id}/play`);
      });
  });

  it("displays all the tags of the medium", async () => {
    const medium = await createMedium();
    const tag1 = await createTag();
    const tag2 = await createTag();

    await medium.$add("tag", [tag1, tag2]);

    await supertest(express)
      .get(`/media/${medium.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(tag1.name);
        expect(res.text).toContain(tag2.name);
      });
  });

  it("displays all related playlists of the medium", async () => {
    const medium = await createMedium();
    const playlist1 = await createPlaylist();
    const playlist2 = await createPlaylist();

    await medium.$add("playlist", [playlist1, playlist2]);

    await supertest(express)
      .get(`/media/${medium.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(playlist1.title);
        expect(res.text).toContain(playlist2.title);
        expect(res.text).toContain(`/playlists/${playlist1.id}`);
        expect(res.text).toContain(`/playlists/${playlist2.id}`);
      });
  });

  it("displays all related categories and labels of the medium", async () => {
    const medium = await createMedium();
    const label = await createLabel();
    const category = await label.$get("category");

    await label.$add("medium", medium);

    await supertest(express)
      .get(`/media/${medium.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(label.text);
        expect(res.text).toContain(category?.name);
      });
  });
});
