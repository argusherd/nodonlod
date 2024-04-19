import PlayablePlaylist from "@/database/models/playable-playlist";
import { createPlayable, createPlaylist } from "../../setup/create-playable";

describe("The pivot between playable and playlist", () => {
  it("removes the relationship once one of them has been deleted", async () => {
    const playable = await createPlayable();
    const playlist = await createPlaylist();

    await playable.$add("playlist", playlist);
    expect(await PlayablePlaylist.findOne()).not.toBeNull();

    await playable.destroy();
    expect(await PlayablePlaylist.findOne()).toBeNull();
  });
});
