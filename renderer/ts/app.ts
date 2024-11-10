import htmx from "htmx.org";
window.htmx = htmx;

import morph from "@alpinejs/morph";
import persist from "@alpinejs/persist";
import sort from "@alpinejs/sort";
import Alpine from "alpinejs";
import dayjs from "dayjs";
import "htmx.org/dist/ext/alpine-morph";
import "htmx.org/dist/ext/ws";
import neatDuration from "../../src/neat-duration";
import clipboard from "./clipboard";
import playingTrack from "./playing-track";
import { HTMXEvent } from "./renderer";
import wsEvent from "./ws-event";

dayjs.extend(neatDuration);

window.dayjs = dayjs;
window.Alpine = Alpine;
Alpine.plugin(morph);
Alpine.plugin(sort);
Alpine.plugin(persist);
Alpine.data("playingTrack", playingTrack);
Alpine.data("wsEvent", wsEvent);
Alpine.data("clipboard", clipboard);
Alpine.start();

document.addEventListener("htmx:beforeSwap", (event: HTMXEvent) => {
  if (event.detail.xhr.status === 422) {
    event.detail.shouldSwap = true;
    event.detail.isError = true;
  }
});
