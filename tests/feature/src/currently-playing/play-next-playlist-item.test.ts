import {
  play,
  playNextPlaylistable,
  playStatus,
} from "@/src/currently-playing";
import mediaPlayer from "@/src/media-player";
import { createPlaylist, createPlaylistable } from "../../setup/create-model";

describe("The playNextPlaylistable function", () => {
  it("instructs the media play to play the next item in the playlist", async () => {
    const playlist = await createPlaylist();
    const playlistable1 = await createPlaylistable({
      playlistId: playlist.id,
      order: 1,
    });
    const playlistable2 = await createPlaylistable({
      playlistId: playlist.id,
      order: 2,
    });
    const medium = await playlistable2.$get("medium");
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await play(playlistable1);
    await playNextPlaylistable();

    expect(mockedPlay).toHaveBeenCalledWith(medium?.url);
    expect(mockedPlay).toHaveBeenCalledTimes(2);
  });

  it("instruct the media player to play the first item in the play queue if the last item is currently playing", async () => {
    const playlist = await createPlaylist();
    const playlistable1 = await createPlaylistable({
      playlistId: playlist.id,
      order: 1,
    });
    const playlistable2 = await createPlaylistable({
      playlistId: playlist.id,
      order: 2,
    });
    const medium = await playlistable1.$get("medium");
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await play(playlistable2);
    await playNextPlaylistable();

    expect(mockedPlay).toHaveBeenCalledWith(medium?.url);
  });

  it("only searches the same playlist for the item", async () => {
    const playlist1 = await createPlaylist();
    const playlist2 = await createPlaylist();
    const playlistable1 = await createPlaylistable({
      playlistId: playlist1.id,
      order: 1,
    });
    const playlistable2 = await createPlaylistable({
      playlistId: playlist2.id,
      order: 2,
    });
    const medium = await playlistable2.$get("medium");
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await play(playlistable1);
    await playNextPlaylistable();

    expect(mockedPlay).not.toHaveBeenCalledWith(medium?.url);
  });

  it("indicates whether the current playlist item is the last one", async () => {
    const playlist = await createPlaylist();
    const firstItem = await createPlaylistable({
      playlistId: playlist.id,
      order: 1,
    });
    await createPlaylistable({
      playlistId: playlist.id,
      order: 2,
    });

    await play(firstItem);
    await playNextPlaylistable();

    expect(playStatus.isLastOne).toBeTruthy();
  });
});
