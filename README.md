﻿# Studio DRM Shaka

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

## Description

This repo will demonstrate how to use [Studio DRM](https://developer.jwplayer.com/jwplayer/docs/studio-drm-standalone-getting-started) with Google's [Shaka Player](https://shaka-player-demo.appspot.com/docs/api/tutorial-welcome.html).
If you have any questions please contact <support@jwplayer.com>

This repo is currently targeted at [version 4.5.0](https://github.com/shaka-project/shaka-player/releases/tag/v4.5.0) of the shaka player.

## Instructions

### Install dependencies

1. Install [npm](https://www.npmjs.com/)
2. Install the [grunt-cli](https://www.npmjs.com/package/grunt-cli): `npm install -g grunt-cli`
3. Clone the repo: `git clone git@github.com:Vualto/vuplay-shaka.git`
4. Navigate to the project's root folder: `cd studiodrm-shaka`
5. Install the dependencies: `npm install`

### Set required variables

1. Open the repo in your favourite javascript editor.
2. In the file `studiodrm.js` replace `<mpeg-dash-stream-url>` with your [MPEG-DASH](https://en.wikipedia.org/wiki/Dynamic_Adaptive_Streaming_over_HTTP) stream url.
3. In the file `studiodrm.js` replace `<hls-stream-url>` with your [HLS](https://en.wikipedia.org/wiki/HTTP_Live_Streaming) stream url.
4. In the file `studiodrm.js` replace `<studiodrm-token>` with a Studio DRM token. Details can be found in the [Studio DRM Token v2 documentation](https://developer.jwplayer.com/jwplayer/docs/studio-drm-token-api-v2)
5. In the file `studiodrm.js` replace `<fairplay-certificate-url>` with the link to your Fairplay certifcate.

### Build and run the code

This repo contains a development node.js server. This server is not suitable for production.

1. Add the host `shaka.studiodrm.local` to your local machine's hosts file.
2. Run `grunt serve`.
3. Load a supported browser and go to `https://shaka.studiodrm.local:14703`

In order to allow DRM encrypted playback in chrome (https://goo.gl/EEhZqT), SSL has been enabled for the demo. You will get a warning about an invalid cert `NET::ERR_CERT_AUTHORITY_INVALID` but this can safely be ignored.

NB: If you wish to use the uncompiled version of shaka run `grunt serve --debug`

### Browser support

The browser must support [encrypted media extensions](https://www.w3.org/TR/2016/CR-encrypted-media-20160705/).
Currently this includes the latest versions of Chrome, Firefox, Internet Explorer 11 and Edge.
For a complete breakdown of supported media extensions please contact <support@jwplayer.com>

## Useful links

### Studio DRM

-   [Contact JW Player](https://support.jwplayer.com/)
-   [Studio DRM](https://developer.jwplayer.com/jwplayer/docs/studio-drm-standalone-getting-started)
-   [Studio DRM token documentation](https://developer.jwplayer.com/jwplayer/docs/studio-drm-token-api-v2)
-   [JW Player documentation on the configuration of DRM with Shaka Player](https://developer.jwplayer.com/jwplayer/docs/studio-drm-standalone-web-players#shaka)

### mpeg-DASH

-   [MPEG-DASH](https://en.wikipedia.org/wiki/Dynamic_Adaptive_Streaming_over_HTTP)
-   [What is MPEG-DASH](http://www.streamingmedia.com/Articles/Editorial/What-Is-.../What-is-MPEG-DASH-79041.aspx)
-   [Widevine](http://www.widevine.com/)
-   [PlayReady](https://www.microsoft.com/playready/)

### HLS

-   [Apple's introduction to HLS](https://developer.apple.com/streaming/)
-   [Fairplay](https://developer.apple.com/streaming/fps/)

### Encrpyted media extensions

-   [Encrypted media extensions specification](https://www.w3.org/TR/2016/CR-encrypted-media-20160705/)
-   [Encrypted media extensions wikipedia](https://en.wikipedia.org/wiki/Encrypted_Media_Extensions)
-   [Encrypted media extensions on MDN](https://developer.mozilla.org/en-US/docs/Web/API/Encrypted_Media_Extensions_API)
-   [Intro to encrypted media extensions](https://www.html5rocks.com/en/tutorials/eme/basics/)

### Shaka

-   [Welcome to shaka](https://shaka-player-demo.appspot.com/docs/api/tutorial-welcome.html)
-   [Shaka github page](https://github.com/google/shaka-player)

### Build tools

-   [npm](https://www.npmjs.com/)
-   [grunt](http://gruntjs.com/)
