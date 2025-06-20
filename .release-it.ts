import type { Config } from "release-it";

export default {
  github: {
    release: false,
  },
  npm: {
    publish: false,
  },
  plugins: {
    "@release-it/conventional-changelog": {
      header: "# Changelog",
      infile: "CHANGELOG.md",
      preset: {
        name: "conventionalcommits",
        types: [
          { type: "feat", section: "Features" },
          { type: "fix", section: "Bug Fixes" },
          { type: "chore", hidden: true },
          { type: "docs", hidden: true },
          { type: "style", hidden: true },
          { type: "refactor", section: "Refactorings" },
          { type: "perf", section: "Performance" },
          { type: "test", hidden: true },
        ],
      },
    },
  },
} satisfies Config;
