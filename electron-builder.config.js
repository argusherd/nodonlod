/** @type {import('electron-builder').Configuration} */
module.exports = {
  asar: true,
  extraFiles: [".env.example", "bin"],
  files: ["main", "public", "views", "locales"],
};
