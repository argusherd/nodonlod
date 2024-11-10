const clipboard = (shouldCopy = "") => ({
  copying: false,
  timeoutId: null,
  writeText: {
    ["@click"]() {
      if (this.timeoutId) clearTimeout(this.timeoutId);

      this.copying = true;
      navigator.clipboard.writeText(shouldCopy);
      this.timeoutId = setTimeout(() => (this.copying = false), 1000);
    },
  },
});

export default clipboard;
