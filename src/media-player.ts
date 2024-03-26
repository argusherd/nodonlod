import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import EventEmitter from "events";
import { Socket } from "net";
import { join } from "path";

interface PlayerObserver {
  emit(event: "duration", duration: number): void;
  emit(event: "current-time", currentTime: number): void;

  /**
   * @param event
   * @param listener - duration is in seconds, ex. 123.120000
   */
  on(event: "duration", listener: (duration: number) => void): void;
  /**
   * @param event
   * @param listener - currentTime is in seconds, ex. 123.120000
   */
  on(event: "current-time", listener: (currentTime: number) => void): void;
  on(event: string, listener: (...args: any[]) => void): void;
}

interface IpcMessage {
  event: "property-change";
  name: "duration" | "time-pos";
  data?: any;
}

export interface MediaPlayer {
  launch: () => void;
  play: (url: string) => void;
  pause: () => void;
  resume: () => void;
  on: Pick<PlayerObserver, "on">["on"];
}

const ipcPath =
  process.platform === "win32" ? "\\\\.\\pipe\\mpvsocket" : "/tmp/mpvsocket";
const mpvPath = join(process.cwd(), "./bin/mpv");
const mpvArgs = `--idle --keep-open --force-window --input-ipc-server=${ipcPath}`;

const commandQueue: string[] = [];
const playerObserver: PlayerObserver = new EventEmitter();

let ipcClient: Socket;
let mpvPlayer: ChildProcessWithoutNullStreams;
let connectInterval: NodeJS.Timeout;
let isConnected = false;

const commandPrompt = (command: any[]): string =>
  JSON.stringify({ command }) + "\n";

const launchPlayer = () => {
  mpvPlayer = spawn(mpvPath, mpvArgs.split(" "));
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

    if (message.event === "property-change" && "data" in message) {
      if (message.name === "duration")
        playerObserver.emit("duration", message.data);
      else if (message.name === "time-pos")
        playerObserver.emit("current-time", message.data);
    }
  }
};

const mediaPlayer: MediaPlayer = {
  launch: launchPlayer,
  play: (url: string) => {
    if (isConnected) {
      ipcClient.write(commandPrompt(["loadfile", url]));
      return;
    }

    commandQueue.push(commandPrompt(["loadfile", url]));
    launchPlayer();
  },
  pause: () => ipcClient.write(commandPrompt(["set_property", "pause", true])),
  resume: () =>
    ipcClient.write(commandPrompt(["set_property", "pause", false])),
  on: (event, listener) => {
    playerObserver.on(event, listener);
  },
};

export default mediaPlayer;
