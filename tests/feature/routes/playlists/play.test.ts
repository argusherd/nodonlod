import express from "@/routes";
import mediaPlayer from "@/src/media-player";
import supertest from "supertest";
import {
  createChapter,
  createMedium,
  createPlaylist,
  createPlaylistable,
} from "../../setup/create-model";

describe("The playlist play route", () => {
  it("instructs the media player to play the first item of the playlist", async () => {
    const playlist = await createPlaylist();
    const medium = await createMedium();
    const chapter = await createChapter({
      mediumId: medium.id,
      startTime: 10,
      endTime: 30,
    });

    await createPlaylistable({
      playlistId: playlist.id,
      mediumId: medium.id,
      chapterId: chapter.id,
      order: 1,
    });

    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await supertest(express).get(`/playlists/${playlist.id}/play`).expect(200);

    expect(mockedPlay).toHaveBeenCalledWith(medium.url, 10, 30);
  });

  it("displays the first item in the playlist and the next item", async () => {
    const playlist = await createPlaylist({
      thumbnail: "https://foo.com/bar.jpg",
    });

    await createPlaylistable({ playlistId: playlist.id, order: 1 });

    const nextItem = await createPlaylistable({
      playlistId: playlist.id,
      order: 2,
    });

    await supertest(express)
      .get(`/playlists/${playlist.id}/play`)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`/playlists/${playlist.id}/playlistables`);
        expect(res.text).toContain("https://foo.com/bar.jpg");
        expect(res.text).toContain(
          `/playlists/${playlist.id}/playlistables/${nextItem.id}/play`,
        );
      });
  });

  it("does nothing if there are no items in the playlist", async () => {
    const playlist = await createPlaylist();

    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await supertest(express).get(`/playlists/${playlist.id}/play`).expect(204);

    expect(mockedPlay).not.toHaveBeenCalled();
  });
});
