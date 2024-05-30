import PlaylistItem from "@/database/models/playlist-item";
import {
  createChapter,
  createPlayable,
  createPlaylist,
} from "../../setup/create-model";

describe("The pivot between playable and playlist", () => {
  it("removes the relationship once one of them has been deleted", async () => {
    const playable = await createPlayable();
    const playlist = await createPlaylist();

    await playable.$add("playlist", playlist);
    expect(await PlaylistItem.findOne()).not.toBeNull();

    await playable.destroy();
    expect(await PlaylistItem.findOne()).toBeNull();
  });

  it("can belong to a chapter", async () => {
    const chapter = await createChapter();
    const playlist = await createPlaylist();

    const playlistItem = await PlaylistItem.create({
      playableId: chapter.playableId,
      playlistId: playlist.id,
      chapterId: chapter.id,
    });

    const belongsTo = await playlistItem.$get("chapter");

    expect(belongsTo?.id).toEqual(chapter.id);
  });

  it("treats the playableId, playlistId, and chapterId as an unique set", async () => {
    const playable = await createPlayable();
    const chapter = await createChapter({ playableId: playable.id });
    const playlist = await createPlaylist();

    await PlaylistItem.create({
      playableId: playable.id,
      playlistId: playlist.id,
      chapterId: chapter.id,
    });

    await expect(
      PlaylistItem.create({
        playableId: playable.id,
        playlistId: playlist.id,
        chapterId: chapter.id,
      }),
    ).rejects.toThrow();
  });
});