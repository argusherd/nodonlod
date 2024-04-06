import htmx from "htmx.org";
window.htmx = htmx;

import "htmx.org/dist/ext/ws";
import { HTMXEvent } from "./renderer";

document.addEventListener("htmx:beforeSwap", (event: HTMXEvent) => {
  if (event.detail.xhr.status === 422) {
    event.detail.shouldSwap = true;
    event.detail.isError = true;
  }
});
