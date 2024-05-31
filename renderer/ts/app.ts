import htmx from "htmx.org";
window.htmx = htmx;

import Alpine from "alpinejs";
import "htmx.org/dist/ext/ws";
import currentTime from "./current-time";
import { HTMXEvent } from "./renderer";

window.Alpine = Alpine;
Alpine.data("currentTime", currentTime);
Alpine.start();

document.addEventListener("htmx:beforeSwap", (event: HTMXEvent) => {
  if (event.detail.xhr.status === 422) {
    event.detail.shouldSwap = true;
    event.detail.isError = true;
  }
});
