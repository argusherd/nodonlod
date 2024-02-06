import htmx from "htmx.org";

export {};

declare global {
  interface Window {
    htmx: typeof htmx;
  }
}
