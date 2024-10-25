const playingTrack = () => ({
  currentTime: 0,
  duration: 0,
  percentage: 50,
  volume: 100,
  mute: false,
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
        } else if ("duration" in payload) this.duration = payload.duration;
        else if ("volume" in payload) this.volume = payload.volume;
        else if ("mute" in payload) this.mute = payload.mute;
      } catch (e) {}
    };
  },
});

export default playingTrack;
