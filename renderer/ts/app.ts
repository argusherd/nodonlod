import htmx from "htmx.org";
window.htmx = htmx;

import Alpine from "alpinejs";
import "htmx.org/dist/ext/ws";
import { HTMXEvent } from "./renderer";

window.Alpine = Alpine;
Alpine.start();

document.addEventListener("htmx:beforeSwap", (event: HTMXEvent) => {
  if (event.detail.xhr.status === 422) {
    event.detail.shouldSwap = true;
    event.detail.isError = true;
  }
});
