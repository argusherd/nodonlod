import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

const currentTime = () => ({
  currentTime: "",
  ws: new WebSocket(`ws://${window.location.host}`),

  init() {
    (this.ws as WebSocket).onmessage = (message) => {
      try {
        const payload = JSON.parse(message.data);

        if ("currentTime" in payload)
          this.currentTime = dayjs
            .duration(payload.currentTime, "seconds")
            .format("HH:mm:ss");
      } catch (e) {}
    };
  },
});

export default currentTime;
