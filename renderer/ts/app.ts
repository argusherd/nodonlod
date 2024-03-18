import htmx from "htmx.org";
import { HTMXEvent } from "./renderer";

window.htmx = htmx;

document.addEventListener("htmx:beforeSwap", (event: HTMXEvent) => {
  if (event.detail.xhr.status === 422) {
    event.detail.shouldSwap = true;
    event.detail.isError = true;
  }
});
