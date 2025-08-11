# Nodonload

Tired of YouTube repeatedly deleting videos without telling you what the original title was?<br>
Do you need a better tool to manage all the URLs you have collected, not just a text file?

Try nodonload.
Nodonload is a personal media platform resource management tool.
By integrating [mpv](https://mpv.io/) and [yt-dlp](https://github.com/yt-dlp/yt-dlp), you can access your collection in a single place.

## Target audience

✅ You will benefit from nodonload if your usage habits conform to the following situations.

- All your collections come from online media platforms like [YouTube](https://www.youtube.com/), [SoundCloud](https://soundcloud.com/), or any other platform that [yt-dlp supports](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md).
- Only a few local files need to be managed.
- You want to manually create your own playlists and labels in order to sort collections more clearly.
- You collections can be easily swapped by an alternative version or link.

❌ You will not benefit from nodonload if your usage habits conform to the following situations.

- All your collections come from [Spotify](https://open.spotify.com/), [Netflix](https://www.netflix.com/), or any other online media platforms that are **NOT** on [the yt-dlp supported list](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md).
- The majority of your collections are local files. (It will be a pain to migrate to another device.)
- You don't want to manually manage every single one of your collections.
- You don't want to rely on a third-party tool.

## .env file

### General

- OPEN_DEV_TOOLS: Toggle the Chromium DevTools when opening the app. (0: close | 1: open)
- SERVER_PORT: The network port of the internal server of the app. (default: 6869)
- MPV_OPTION_APPEND: The terminal string appends when the mpv player is opened.

  > For example, open the media with audio only: --ytdl-raw-options-append=format=bestaudio/best

  Check out the [mpv documentation](https://mpv.io/manual/master/#options) for more information.

### Development

- NODE_ENV: Determine the execution environment. Only for development purposes. (production | development | test)
- SEQUELIZE_STORAGE: The file name of the app's database.
- SEQUELIZE_LOGGING: Toggle the SQL statements' console logging during development.
- UMZUG_MIGRATOR_LOGGING: Toggle the migration console logging during development.
