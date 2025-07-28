const wsEvent = () => ({
  ws: new WebSocket(`ws://${window.location.host}`),

  init() {
    (this.ws as WebSocket).onmessage = (message) => {
      try {
        const payload = JSON.parse(message.data);

        if ("event" in payload) this.$dispatch(payload.event, payload.data);
      } catch (e) {}
    };
  },
});

export default wsEvent;
