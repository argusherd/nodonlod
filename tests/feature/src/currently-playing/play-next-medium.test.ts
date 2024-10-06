import { play, playNextMedium } from "@/src/currently-playing";
import mediaPlayer from "@/src/media-player";
import dayjs from "dayjs";
import { createMedium } from "../../setup/create-model";

describe("The playNextMedium function", () => {
  it("plays the latest medium by default", async () => {
    const medium1 = await createMedium();
    const medium2 = await createMedium({
      createdAt: dayjs().subtract(1, "day").toDate(),
    });
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await playNextMedium();

    expect(mockedPlay).toHaveBeenCalledWith(medium1.url);
    expect(mockedPlay).not.toHaveBeenCalledWith(medium2.url);
  });

  it("instructs the media player to play the next latest medium in the database", async () => {
    const medium1 = await createMedium();
    const medium2 = await createMedium({
      createdAt: dayjs().subtract(1, "day").toDate(),
    });
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await play(medium1);
    await playNextMedium();

    expect(mockedPlay).toHaveBeenCalledWith(medium2.url);
  });
});
