import Alpine from "alpinejs";
import dayjs from "dayjs";
import htmx from "htmx.org";

export {};

declare global {
  interface Window {
    Alpine: typeof Alpine;
    dayjs: typeof dayjs;
    htmx: typeof htmx;
  }
}

export interface HTMXEvent extends Event {
  detail: {
    isError: Boolean;
    shouldSwap: Boolean;
    xhr: XMLHttpRequest;
  };
}
