import { play, playNextPlaylistItem } from "@/src/currently-playing";
import mediaPlayer from "@/src/media-player";
import { createPlaylist, createPlaylistItem } from "../../setup/create-model";

describe("The playNextPlaylistItem function", () => {
  it("instructs the media play to play the next item in the playlist", async () => {
    const playlist = await createPlaylist();
    const playlistItem1 = await createPlaylistItem({
      playlistId: playlist.id,
      order: 1,
    });
    const playlistItem2 = await createPlaylistItem({
      playlistId: playlist.id,
      order: 2,
    });
    const medium = await playlistItem2.$get("medium");
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await play(playlistItem1);
    await playNextPlaylistItem();

    expect(mockedPlay).toHaveBeenCalledWith(medium?.url);
    expect(mockedPlay).toHaveBeenCalledTimes(2);
  });

  it("instruct the media player to play the first item in the play queue if the last item is currently playing", async () => {
    const playlist = await createPlaylist();
    const playlistItem1 = await createPlaylistItem({
      playlistId: playlist.id,
      order: 1,
    });
    const playlistItem2 = await createPlaylistItem({
      playlistId: playlist.id,
      order: 2,
    });
    const medium = await playlistItem1.$get("medium");
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await play(playlistItem2);
    await playNextPlaylistItem();

    expect(mockedPlay).toHaveBeenCalledWith(medium?.url);
  });

  it("only searches the same playlist for the item", async () => {
    const playlist1 = await createPlaylist();
    const playlist2 = await createPlaylist();
    const playlistItem1 = await createPlaylistItem({
      playlistId: playlist1.id,
      order: 1,
    });
    const playlistItem2 = await createPlaylistItem({
      playlistId: playlist2.id,
      order: 2,
    });
    const medium = await playlistItem2.$get("medium");
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await play(playlistItem1);
    await playNextPlaylistItem();

    expect(mockedPlay).not.toHaveBeenCalledWith(medium?.url);
  });
});
