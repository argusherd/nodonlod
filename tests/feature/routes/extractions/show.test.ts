import Extraction from "@/database/models/extraction";
import express from "@/routes";
import { formatSeconds } from "@/src/neat-duration";
import { RawMedium, RawPlaylist, thumbnails } from "@/src/raw-info-extractor";
import dayjs from "dayjs";
import supertest from "supertest";
import {
  createRawMedium,
  createRawPlaylist,
} from "../../setup/create-raw-info";

describe("The extraction show page", () => {
  const videoURL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  const playlistURL =
    "https://www.youtube.com/playlist?list=OLAK5uy_l4pFyLY9N1YSGpxT0EEq8Whc8OyhpWsm8";

  it("can only be accessed with an existing extraction", async () => {
    await supertest(express).get("/extractions/NOT_EXIST").expect(404);
  });

  it("displays the content of an extraction with raw-medium", async () => {
    const rawMedium = createRawMedium();

    const extraction = await Extraction.create({
      url: videoURL,
      content: JSON.stringify(rawMedium),
    });

    await supertest(express)
      .get(`/extractions/${extraction.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`value="0"`); // age_limit
        expect(res.text).toContain(rawMedium.description);
        expect(res.text).toContain(formatSeconds(rawMedium.duration));
        expect(res.text).toContain(rawMedium.id);
        expect(res.text).toContain(rawMedium.title);
        expect(res.text).toContain(rawMedium.thumbnail);
        expect(res.text).toContain(rawMedium.webpage_url);
        expect(res.text).toContain(
          (rawMedium.thumbnails as thumbnails)[0]?.url,
        );
        expect(res.text).toContain(
          (rawMedium.thumbnails as thumbnails)[1]?.url,
        );
        expect(res.text).toContain(
          dayjs(rawMedium.upload_date).format("YYYY-MM-DD"),
        );
      });
  });

  it("displays well-formatted duration", async () => {
    const rawMedium = createRawMedium({
      duration: 123,
    });

    const extraction = await Extraction.create({
      url: videoURL,
      content: JSON.stringify(rawMedium),
    });

    await supertest(express)
      .get(`/extractions/${extraction.id}`)
      .expect((res) => {
        expect(res.text).toContain("2:03");
      });
  });

  it("displays a form that can save the medium information if the extracted content is not empty", async () => {
    const extraction = await Extraction.create({
      url: videoURL,
      content: null,
    });

    await supertest(express)
      .get(`/extractions/${extraction.id}`)
      .expect((res) => {
        expect(res.text).not.toContain(
          `action="/extractions/${extraction.id}/convert"`,
        );
        expect(res.text).not.toContain(`method="post"`);
      });

    await extraction.update({ content: JSON.stringify(createRawMedium()) });

    await supertest(express)
      .get(`/extractions/${extraction.id}`)
      .expect((res) => {
        expect(res.text).toContain(
          `action="/extractions/${extraction.id}/convert"`,
        );
        expect(res.text).toContain(`method="post"`);
      });
  });

  it("prioritizes displaying channel information over the uploader's information due to YouTube's preference for Topic channels", async () => {
    const extraction = await Extraction.create({
      url: videoURL,
      content: JSON.stringify(
        createRawMedium({
          channel: "Rick Astley (channel)",
          channel_id: "UCuAXFkgsw1L7xaCfnd5JJOw",
          channel_url:
            "https://www.youtube.com/channel/UCuAXFkgsw1L7xaCfnd5JJOw",
          uploader: "Rick Astley (uploader)",
          uploader_id: "@RickAstleyYT",
          uploader_url: "https://www.youtube.com/@RickAstleyYT",
        }),
      ),
    });

    await supertest(express)
      .get(`/extractions/${extraction.id}`)
      .expect((res) => {
        expect(res.text).toContain("Rick Astley (channel)");
        expect(res.text).toContain("UCuAXFkgsw1L7xaCfnd5JJOw");
        expect(res.text).toContain(
          "https://www.youtube.com/channel/UCuAXFkgsw1L7xaCfnd5JJOw",
        );
        expect(res.text).not.toContain("Rick Astley (uploader)");
        expect(res.text).not.toContain("@RickAstleyYT");
        expect(res.text).not.toContain("https://www.youtube.com/@RickAstleyYT");
      });
  });

  it("displays the uploader's information if there is no channel information available from the extracted content", async () => {
    const extraction = await Extraction.create({
      url: videoURL,
      content: JSON.stringify(
        createRawMedium({
          channel: null,
          channel_id: null,
          channel_url: null,
          uploader: "Rick Astley",
          uploader_id: "@RickAstleyYT",
          uploader_url: "https://www.youtube.com/@RickAstleyYT",
        }),
      ),
    });

    await supertest(express)
      .get(`/extractions/${extraction.id}`)
      .expect((res) => {
        expect(res.text).toContain("Rick Astley");
        expect(res.text).toContain("@RickAstleyYT");
        expect(res.text).toContain("https://www.youtube.com/@RickAstleyYT");
      });
  });

  it("displays an error message if an issue occurs during the extraction process", async () => {
    const extraction = await Extraction.create({
      url: videoURL,
      error: "media not found",
    });

    await supertest(express)
      .get(`/extractions/${extraction.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain("media not found");
      });
  });

  it("can also display playlist information from the extracted content", async () => {
    const rawPlaylist: RawPlaylist = createRawPlaylist();

    const extraction = await Extraction.create({
      url: playlistURL,
      content: JSON.stringify(rawPlaylist),
    });

    await supertest(express)
      .get(`/extractions/${extraction.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(rawPlaylist.description);
        expect(res.text).toContain(rawPlaylist.id);
        expect(res.text).toContain(
          (rawPlaylist.thumbnails as thumbnails)[0]?.url,
        );
        expect(res.text).toContain(
          (rawPlaylist.thumbnails as thumbnails)[1]?.url,
        );
        expect(res.text).toContain(rawPlaylist.title);
        expect(res.text).toContain(rawPlaylist.webpage_url);
      });
  });

  it("displays a form that can save the playlist information from the extracted content", async () => {
    const extraction = await Extraction.create({
      url: playlistURL,
      content: null,
    });

    await supertest(express)
      .get(`/extractions/${extraction.id}`)
      .expect((res) => {
        expect(res.text).not.toContain(
          `action="/extractions/${extraction.id}/convert"`,
        );
        expect(res.text).not.toContain(`method="post"`);
      });

    await extraction.update({ content: JSON.stringify(createRawPlaylist()) });

    await supertest(express)
      .get(`/extractions/${extraction.id}`)
      .expect((res) => {
        expect(res.text).toContain(
          `action="/extractions/${extraction.id}/convert"`,
        );
        expect(res.text).toContain(`method="post"`);
      });
  });

  it("lists all entries of the playlist information from the extracted content", async () => {
    const rawMedium1 = createRawMedium();
    const rawMedium2 = createRawMedium();
    const rawPlaylist: RawPlaylist = createRawPlaylist({
      entries: [rawMedium1, rawMedium2],
    });

    const extraction = await Extraction.create({
      url: playlistURL,
      content: JSON.stringify(rawPlaylist),
    });

    await supertest(express)
      .get(`/extractions/${extraction.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(rawMedium1.description);
        expect(res.text).toContain(formatSeconds(rawMedium1.duration));
        expect(res.text).toContain(rawMedium1.id);
        expect(res.text).toContain(rawMedium1.thumbnail);
        expect(res.text).toContain(rawMedium1.title);
        expect(res.text).toContain(rawMedium1.webpage_url);
        expect(res.text).toContain(
          dayjs(rawMedium1.upload_date).format("YYYY-MM-DD"),
        );

        expect(res.text).toContain(rawMedium2.description);
        expect(res.text).toContain(formatSeconds(rawMedium2.duration));
        expect(res.text).toContain(rawMedium2.id);
        expect(res.text).toContain(rawMedium2.thumbnail);
        expect(res.text).toContain(rawMedium2.title);
        expect(res.text).toContain(rawMedium2.webpage_url);
        expect(res.text).toContain(
          dayjs(rawMedium2.upload_date).format("YYYY-MM-DD"),
        );
      });
  });

  it("can display nested playlist information from the extracted content, such as a YouTube channel", async () => {
    const channelURL =
      "https://www.youtube.com/channel/UCuAXFkgsw1L7xaCfnd5JJOw";
    const rawMedium = createRawMedium();
    const nestedRawPlaylist = createRawPlaylist({ entries: [rawMedium] });
    const rawPlaylist = createRawPlaylist({ entries: [nestedRawPlaylist] });

    const extraction = await Extraction.create({
      url: channelURL,
      content: JSON.stringify(rawPlaylist),
    });

    await supertest(express)
      .get(`/extractions/${extraction.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(rawPlaylist.id);
        expect(res.text).toContain(rawPlaylist.description);
        expect(res.text).toContain(nestedRawPlaylist.id);
        expect(res.text).toContain(nestedRawPlaylist.description);
        expect(res.text).toContain(rawMedium.id);
        expect(res.text).toContain(rawMedium.description);
      });
  });

  it("can display raw-medium successfully without optional properties", async () => {
    const onlyRequired: RawMedium = {
      _type: "video",
      duration: 123,
      id: "ID",
      title: "TITLE",
      webpage_url: videoURL,
      webpage_url_domain: "youtube.com",
    };

    const extraction = await Extraction.create({
      url: videoURL,
      content: JSON.stringify(onlyRequired),
    });

    await supertest(express).get(`/extractions/${extraction.id}`).expect(200);
  });

  it("can display raw-playlist without optional properties", async () => {
    const onlyRequired: RawPlaylist = {
      _type: "playlist",
      entries: [],
      id: "ID",
      webpage_url: videoURL,
      webpage_url_domain: "youtube.com",
    };

    const extraction = await Extraction.create({
      url: playlistURL,
      content: JSON.stringify(onlyRequired),
    });

    await supertest(express).get(`/extractions/${extraction.id}`).expect(200);
  });

  it("displays a processing message to indicate that the extraction is currently in progress", async () => {
    const extraction = await Extraction.create({
      url: videoURL,
      isProcessing: true,
    });

    await supertest(express)
      .get(`/extractions/${extraction.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain("Processing");
      });
  });
});
