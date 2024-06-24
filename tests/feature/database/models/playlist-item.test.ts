import PlaylistItem from "@/database/models/playlist-item";
import {
  createChapter,
  createMedium,
  createPlaylist,
} from "../../setup/create-model";

describe("The pivot between medium and playlist", () => {
  it("removes the relationship once one of them has been deleted", async () => {
    const medium = await createMedium();
    const playlist = await createPlaylist();

    await medium.$add("playlist", playlist);
    expect(await PlaylistItem.findOne()).not.toBeNull();

    await medium.destroy();
    expect(await PlaylistItem.findOne()).toBeNull();
  });

  it("can belong to a chapter", async () => {
    const chapter = await createChapter();
    const playlist = await createPlaylist();

    const playlistItem = await PlaylistItem.create({
      mediumId: chapter.mediumId,
      playlistId: playlist.id,
      chapterId: chapter.id,
    });

    const belongsTo = await playlistItem.$get("chapter");

    expect(belongsTo?.id).toEqual(chapter.id);
  });

  it("treats the mediumId, playlistId, and chapterId as an unique set", async () => {
    const medium = await createMedium();
    const chapter = await createChapter({ mediumId: medium.id });
    const playlist = await createPlaylist();

    await PlaylistItem.create({
      mediumId: medium.id,
      playlistId: playlist.id,
      chapterId: chapter.id,
    });

    await expect(
      PlaylistItem.create({
        mediumId: medium.id,
        playlistId: playlist.id,
        chapterId: chapter.id,
      }),
    ).rejects.toThrow();
  });
});
