import dayjs, { PluginFunc } from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

declare module "dayjs" {
  export function neatDuration(seconds: number): string;
}

type HasNeatDuration = typeof dayjs & {
  neatDuration: typeof formatSeconds;
};

export function formatSeconds(seconds: number) {
  if (seconds < 600) return dayjs.duration(seconds, "seconds").format("m:ss");
  if (seconds < 3600) return dayjs.duration(seconds, "seconds").format("mm:ss");

  const hours = Math.floor(seconds / 3600);
  const remain = seconds % 3600;

  return `${hours}:${dayjs.duration(remain, "seconds").format("mm:ss")}`;
}

const neatDuration: PluginFunc = (
  _option,
  _dayjsClass,
  dayjsFactory: HasNeatDuration,
) => {
  dayjsFactory.neatDuration = formatSeconds;
};

export default neatDuration;
