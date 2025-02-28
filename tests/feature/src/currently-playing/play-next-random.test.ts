import { play, playNextRandom } from "@/src/currently-playing";
import mediaPlayer from "@/src/media-player";
import {
  createMedium,
  createPlayQueue,
  createPlaylist,
  createPlaylistable,
} from "../../setup/create-model";

describe("The playNextRandom function", () => {
  it("plays a random medium without any issues", async () => {
    const medium = await createMedium();
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await playNextRandom();

    expect(mockedPlay).toHaveBeenCalledWith(medium.url);
  });

  it("can play a random item from the playlist", async () => {
    const playlist = await createPlaylist();
    const playlistable1 = await createPlaylistable({ playlistId: playlist.id });
    const playlistable2 = await createPlaylistable({ playlistId: playlist.id });
    const medium = await playlistable2.$get("medium");
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await play(playlistable1);
    await playlistable1.destroy();
    await playNextRandom();

    expect(mockedPlay).toHaveBeenCalledWith(medium?.url);
  });

  it("can play a random item from the play queue", async () => {
    const playQueue1 = await createPlayQueue();
    const playQueue2 = await createPlayQueue();
    const medium = await playQueue2.$get("medium");
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await play(playQueue1);
    await playQueue1.destroy();
    await playNextRandom();

    expect(mockedPlay).toHaveBeenCalledWith(medium?.url);
  });
});
