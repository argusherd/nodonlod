import { playNextRandom } from "@/src/currently-playing";
import mediaPlayer from "@/src/media-player";
import { createMedium } from "../../setup/create-model";

describe("The playNextRandom function", () => {
  it("plays a random medium without any issues", async () => {
    const medium = await createMedium();
    const mockedPlay = jest.spyOn(mediaPlayer, "play").mockImplementation();

    await playNextRandom();

    expect(mockedPlay).toHaveBeenCalledWith(medium.url);
  });
});
