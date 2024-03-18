import htmx from "htmx.org";

export {};

declare global {
  interface Window {
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
