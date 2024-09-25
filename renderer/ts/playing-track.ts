const playingTrack = () => ({
  currentTime: 0,
  duration: 0,
  ws: new WebSocket(`ws://${window.location.host}`),

  init() {
    (this.ws as WebSocket).onmessage = (message) => {
      try {
        const payload = JSON.parse(message.data);

        if ("currentTime" in payload) this.currentTime = payload.currentTime;
        if ("duration" in payload) this.duration = payload.duration;
      } catch (e) {}
    };
  },
});

export default playingTrack;
