import Alpine from "alpinejs";
import htmx from "htmx.org";

export {};

declare global {
  interface Window {
    htmx: typeof htmx;
    Alpine: typeof Alpine;
  }
}

export interface HTMXEvent extends Event {
  detail: {
    isError: Boolean;
    shouldSwap: Boolean;
    xhr: XMLHttpRequest;
  };
}
