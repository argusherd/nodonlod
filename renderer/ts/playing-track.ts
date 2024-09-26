const playingTrack = () => ({
  currentTime: 0,
  duration: 0,
  percentage: 50,
  ws: new WebSocket(`ws://${window.location.host}`),

  init() {
    (this.ws as WebSocket).onmessage = (message) => {
      try {
        const payload = JSON.parse(message.data);

        if ("currentTime" in payload) {
          this.currentTime = payload.currentTime;
          this.percentage = Math.min(
            (this.currentTime / this.duration) * 100,
            100,
          );
        }
        if ("duration" in payload) this.duration = payload.duration;
      } catch (e) {}
    };
  },
});

export default playingTrack;
