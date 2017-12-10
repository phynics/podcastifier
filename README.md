# Podcastifier

This tool fetches videos feeds from online sources and transpiles those to audio to be consumed as podcasts.

## Installation

Podcastifier requires ffmpeg for the transpilation. Make sure to install ffmpeg to your system, or use docker.

Make sure to edit `Configuration.ts` under `src` to your preferences. That is to say; add your podcasts and copy your api key from the Google Cloud Console.

```bash
npm install
npm run build
# either start locally
npm start
# or start in a docker container
npm run deploy
```


## Possible Improvements

- Adapters should be imported from the configuration file.

- Transpiler design should be rework to reduce coupling.

- FeedGenerator and FeedTranspiler are old code. They should be refactored to reduce coupling.

- Implement an error handling scheme and rework pipelines
