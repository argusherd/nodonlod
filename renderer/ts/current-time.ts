const currentTime = () => ({
  currentTime: 0,
  ws: new WebSocket(`ws://${window.location.host}`),

  init() {
    (this.ws as WebSocket).onmessage = (message) => {
      try {
        const payload = JSON.parse(message.data);

        if ("currentTime" in payload) this.currentTime = payload.currentTime;
      } catch (e) {}
    };
  },
});

export default currentTime;
