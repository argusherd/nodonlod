import { ChildProcess, spawn } from "child_process";
import EventEmitter from "events";
import { Socket } from "net";
import { join } from "path";

interface PlayerObserver {
  emit(event: "start", duration: number): void;
  emit(event: "current-time", currentTime: number): void;
  emit(event: "end"): void;
  emit(event: "stop"): void;

  /**
   * @param event
   * @param listener - duration is in seconds, ex. 123.120000
   */
  on(event: "start", listener: (duration: number) => void): void;
  /**
   * @param event
   * @param listener - currentTime is in seconds, ex. 123.120000
   */
  on(event: "current-time", listener: (currentTime: number) => void): void;
  on(event: "end", listener: () => void): void;
  on(event: "stop", listener: () => void): void;
  on(event: string, listener: (...args: any[]) => void): void;
}

interface IpcMessage {
  event: "property-change" | "end-file";
  name: "duration" | "time-pos";
  data?: any;
  request_id?: number;
}

export interface MediaPlayer {
  launch: () => void;
  play: (url: string, startTime?: number, endTime?: number) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  stop: () => void;
  on: Pick<PlayerObserver, "on">["on"];
}

const ipcPath =
  process.platform === "win32" ? "\\\\.\\pipe\\mpvsocket" : "/tmp/mpvsocket";
const mpvPath = join(process.cwd(), "./bin/mpv");
const mpvArgs = `--idle --keep-open --force-window --input-ipc-server=${ipcPath}`;

const commandQueue: string[] = [];
const playerObserver: PlayerObserver = new EventEmitter();
const durationId = 1;

let ipcClient: Socket;
let mpvPlayer: ChildProcess;
let connectInterval: NodeJS.Timeout;
let isConnected = false;
let endOfPlay = false;
let duration = Number.MAX_VALUE;
let startAt = 0;
let endAt = 0;

const commandPrompt = (command: any[], request_id = 0): string =>
  JSON.stringify({ command, request_id }) + "\n";

const launchPlayer = () => {
  mpvPlayer = spawn(
    mpvPath,
    `${mpvArgs} ${process.env.MPV_OPTION_APPEND}`.split(" "),
    { stdio: "ignore" },
  );
  mpvPlayer.on("error", (error) => console.log(error));
  mpvPlayer.on("spawn", connectIpcServer);
};

const connectIpcServer = () => {
  if (!ipcClient) {
    ipcClient = new Socket();

    ipcClient.on("error", (error) => console.log(error));
    ipcClient.on("close", () => (isConnected = false));
    ipcClient.on("connect", socketOnConnect);
    ipcClient.on("data", socketOnData);
  }

  ipcClient.connect(ipcPath);

  if (!isConnected) {
    connectInterval = setInterval(() => ipcClient.connect(ipcPath), 1000);
  }
};

const socketOnConnect = () => {
  isConnected = true;
  clearInterval(connectInterval);

  ipcClient.write(commandPrompt(["observe_property", 0, "duration"]));
  ipcClient.write(commandPrompt(["observe_property", 0, "time-pos"]));

  while (commandQueue.length) {
    ipcClient.write(commandQueue.shift() ?? "");
  }
};

const socketOnData = (data: Buffer) => {
  for (let section of String(data).trim().split("\n")) {
    const message: IpcMessage = JSON.parse(section);

    if (message.event === "end-file") playerObserver.emit("stop");

    if ("data" in message === false) return;

    if (message.name === "duration" || message.request_id === durationId) {
      duration = message.data - 0.1;
      playerObserver.emit("start", message.data);

      if (startAt) mediaPlayer.seek(startAt);

      mediaPlayer.resume();
    }

    if (message.name === "time-pos") {
      playerObserver.emit("current-time", message.data);

      if (endAt && message.data >= endAt) {
        ipcClient.write(commandPrompt(["set_property", "pause", true]));
        playerObserver.emit("end");
      }

      if (duration == Number.MAX_VALUE)
        ipcClient.write(
          commandPrompt(["get_property", "duration"], durationId),
        );

      if (message.data >= duration) playerObserver.emit("end");
    }
  }
};

const mediaPlayer: MediaPlayer = {
  launch: launchPlayer,
  play: (url: string, startTime = 0, endTime = 0) => {
    startAt = startTime;
    endAt = endTime;
    duration = Number.MAX_VALUE;
    endOfPlay = false;

    if (isConnected) {
      ipcClient.write(commandPrompt(["stop"]));
      ipcClient.write(commandPrompt(["loadfile", url]));
      if (startAt) mediaPlayer.pause();
      else mediaPlayer.resume();
      return;
    }

    commandQueue.push(commandPrompt(["loadfile", url]));
    if (startAt)
      commandQueue.push(commandPrompt(["set_property", "pause", true]));
    launchPlayer();
  },
  pause: () => ipcClient.write(commandPrompt(["set_property", "pause", true])),
  resume: () =>
    ipcClient.write(commandPrompt(["set_property", "pause", false])),
  seek: (time: number) => {
    playerObserver.emit("current-time", time);
    ipcClient.write(commandPrompt(["seek", time, "absolute"]));

    if (endOfPlay) {
      mediaPlayer.resume();
      playerObserver.emit("start", duration);
      endOfPlay = false;
    }
  },
  stop: () => {
    ipcClient.write(commandPrompt(["set_property", "pause", true]));
    ipcClient.write(commandPrompt(["seek", startAt, "absolute"]));
    playerObserver.emit("current-time", startAt);
    playerObserver.emit("stop");
    endOfPlay = true;
  },
  on: (event, listener) => {
    playerObserver.on(event, listener);
  },
};

playerObserver.on("end", () => (endOfPlay = true));

export default mediaPlayer;
