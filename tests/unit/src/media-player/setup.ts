import { MediaPlayer } from "@/src/media-player";

jest.mock("child_process", () => ({
  spawn: jest.fn().mockReturnValue({
    on: jest.fn().mockImplementation((event, listener) => {
      if (event === "spawn") listener();
    }),
  }),
}));

jest.mock("net");

export const commandPrompt = (command: any[], request_id = 0): string =>
  JSON.stringify({ command, request_id }) + "\n";

export let mediaPlayer: MediaPlayer;

beforeEach(() => {
  jest.resetAllMocks();
  jest.isolateModules(() => {
    ({ default: mediaPlayer } = require("@/src/media-player"));
  });
});
