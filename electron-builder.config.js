/** @type {import('electron-builder').Configuration} */
module.exports = {
  asar: true,
  extraFiles: [".env.example"],
  files: ["main", "public", "views"],
};
