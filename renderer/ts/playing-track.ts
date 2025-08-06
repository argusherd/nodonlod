const playingTrack = () => ({
  currentTime: 0,
  prevTime: 0,
  elapsed: 0,
  isTrackPlayed: false,
  duration: 0,
  percentage: 50,
  volume: 100,
  mute: false,
  ws: new WebSocket(`ws://${window.location.host}`),

  init() {
    (this.ws as WebSocket).onmessage = (message) => {
      try {
        const payload = JSON.parse(message.data);

        if ("currentTime" in payload) this.setCurrentTime(payload.currentTime);
        else if ("duration" in payload) {
          this.duration = payload.duration;
          this.prevTime = 0;
          this.elapsed = 0;
          this.isTrackPlayed = false;
        } else if ("volume" in payload) this.volume = payload.volume;
        else if ("mute" in payload) this.mute = payload.mute;
      } catch (e) {}
    };
  },
  setCurrentTime(currentTime: number) {
    this.currentTime = currentTime;
    this.percentage = Math.min((this.currentTime / this.duration) * 100, 100);

    if (this.currentTime - this.prevTime >= 1) {
      this.prevTime = this.currentTime;
      this.elapsed++;

      if (
        !this.isTrackPlayed &&
        (this.elapsed >= 30 || this.elapsed >= this.duration / 5)
      ) {
        this.$dispatch("track-played");
        this.isTrackPlayed = true;
      }
    }
  },
});

export default playingTrack;
