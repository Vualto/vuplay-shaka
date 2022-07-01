

// Set your mpeg dash stream url
//var mpegdashStreamUrl = "https://d1chyo78gdexn4.cloudfront.net/vualto-demo/sintel/sintel.ism/manifest.mpd";
var mpegdashStreamUrl = "https://d1chyo78gdexn4.cloudfront.net/vualto-demo/sintel/sintel_nodrm.ism/manifest.mpd";

// Set your HLS stream url
var hlsStreamUrl = "<hls-stream-url>";

// Set your fairplay certificate url
var fairplayCertificateUrl = "<fairplay-certificate-url>";

// Will get overridden with the one from the manifest but we have to set something otherwise shaka will complain!
var fairplayLicenseServerUrl = "https://fairplay-license.vudrm.tech/license";

// Please refer to the following documentation for guidance on generating a Studio DRM token: https://developer.jwplayer.com/jwplayer/docs/studio-drm-token-v2
var studioDrmToken = "vualto-demo|2022-06-27T16:48:34Z|RAQrLiTYv+Z8U9LrxO0JDw==|ae1066177788f83d0e32ec90c834303a18a30269";

// A bit of hacky way to detect Safari but will do for demo purposes...
var isSafari = (navigator.userAgent.indexOf("Safari") != -1 && navigator.userAgent.indexOf("Chrome") == -1);

// Fetch the fairplay certificate used to generate the fairplay license request
function getFairplayCertificate() {
    var certRequest = new XMLHttpRequest();
    certRequest.responseType = "arraybuffer";
    certRequest.open("GET", fairplayCertificateUrl, true);
    certRequest.onload = function (event) {
        if (event.target.status == 200) {
            loadPlayer(new Uint8Array(event.target.response));
        } else {
            var error = new Error("HTTP status: " + event.target.status + " when getting Fairplay Certificate.");
            onError(error);
        }
    };
    certRequest.send();
}

// Returns a shaka player config for use with mpeg-dash streams
function getNonSafariPlayerConfig() {
    return {
        drm: {
            servers: {
                "com.widevine.alpha": "https://widevine-license.vudrm.tech/proxy",
                "com.microsoft.playready": "https://playready-license.vudrm.tech/rightsmanager.asmx"
            }
        }
    }
}

// returns a shaka player config for use with HLS streams
function getSafariPlayerConfig(fairplayCertificate) {
    return {
        drm: {
            servers: {
                "com.apple.fps.1_0": fairplayLicenseServerUrl
            },
            advanced: {
                "com.apple.fps.1_0": {
                    serverCertificate: fairplayCertificate
                }
            },
            initDataTransform: function (initData, initDataType) {
                if (initDataType == "skd") {
                    // Set the Fairplay license server URL with the one from the HLS manifest
                    fairplayLicenseServerUrl = shaka.util.StringUtils.fromBytesAutoDetect(initData);

                    // Create the initData for Fairplay
                    var contentId = fairplayLicenseServerUrl.split("/").pop();
                    var certificate = window.shakaPlayerInstance.drmInfo().serverCertificate;
                    return shaka.util.FairPlayUtils.initDataTransform(initData, contentId, certificate);
                } else {
                    return initData;
                }
            }
        }
    }
}

const CastService = function (stream, token) {
    this._context;
    this._laurl = 'https://widevine-license.vudrm.tech/proxy';
    this._mimeType = 'application/dash+xm';
    this._remotePlayer;
    this._remotePlayerController;
    this._stream = stream;
    this._token = token;
}

CastService.prototype.initCast = function () {
    this._context = cast.framework.CastContext.getInstance()
    this._context.setOptions({
        receiverApplicationId: '9BD166BB',
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
    });

    this._remotePlayer = new cast.framework.RemotePlayer();
    this._remotePlayerController = new cast.framework.RemotePlayerController(this._remotePlayer);
    this._remotePlayerController.addEventListener(
        cast.framework.RemotePlayerEventType.IS_CONNECTED_CHANGED,
        () => { this.connectionHandler(); },
        false
    );

    //document.getElementById('play').addEventListener('click', this.play.bind(this));
}

CastService.prototype.connectionHandler = function () {
    if (!this._remotePlayer.isConnected) return;
    let mediaInfo = new chrome.cast.media.MediaInfo(this._stream, this._mimeType);

    mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
    mediaInfo.metadata.metadataType = chrome.cast.media.MetadataType.GENERIC;
    mediaInfo.metadata.title = 'Vuplay Receiver Demo';
    mediaInfo.customData = { laurl: this._laurl, token: this._token };

    let request = new chrome.cast.media.LoadRequest(mediaInfo);
    let session = this._context.getCurrentSession();
    session.loadMedia(request);
}

CastService.prototype.play = function () {
    
    this._remotePlayerController.playOrPause();
    // var player = new cast.framework.RemotePlayer();
	// var playerController = new cast.framework.RemotePlayerController(player);
	// playerController.playOrPause();
}



// Use shaka.ui.Element as a base class
CastButton = class extends shaka.ui.Element {
    constructor(parent, controls) {
      super(parent, controls);
  
      // The actual button that will be displayed
      this.button_ = document.createElement('button');
      this.button_.textContent = 'DRMCast';
      this.parent.appendChild(this.button_);

      let castService;
  
      // Listen for clicks on the button to start the next playback
      this.eventManager.listen(this.button_, 'click', () => {
        castService = new CastService(mpegdashStreamUrl, studioDrmToken);
        castService.initCast();
      });
    }
  };
  
  
  // Factory that will create a button at run time.
  CastButton.Factory = class {
    create(rootElement, controls) {
      return new CastButton(rootElement, controls);
    }
  };
  
  // Register our factory with the controls, so controls can create button instances.
  shaka.ui.Controls.registerElement(
    /* This name will serve as a reference to the button in the UI configuration object */ 'custom_cast',
    new CastButton.Factory());

async function init() {
    // When using the UI, the player is made automatically by the UI object.
    const video = document.getElementById('video');
    const ui = video['ui'];
    const config = {
        'controlPanelElements':  ['play_pause', 'custom_cast']
    }
    ui.configure(config);
    const controls = ui.getControls();
    const player = controls.getPlayer();



    // Attach player and ui to the window to make it easy to access in the JS console.
    window.player = player;
    window.ui = ui;

    // Listen for error events.
    player.addEventListener('error', onPlayerErrorEvent);
    controls.addEventListener('error', onUIErrorEvent);

    // configure the DRM license servers
    var playerConfig = isSafari ? getSafariPlayerConfig(fairplayCertificate) : getNonSafariPlayerConfig();
    player.configure(playerConfig);

    // Something special is needed for the widevine license request.
    player
        .getNetworkingEngine()
        .registerRequestFilter(function (type, request) {
            // ignore requests that are not license requests.
            if (type != shaka.net.NetworkingEngine.RequestType.LICENSE)
                return;

            // set the Studio DRM token as a header on the license request
            request.headers["X-VUDRM-TOKEN"] = studioDrmToken;

            // custom fairplay license request body required
            if (player.drmInfo().keySystem == "com.apple.fps.1_0") {
                request.headers["Content-Type"] = "ArrayBuffer"
                request.uris = [fairplayLicenseServerUrl.replace("skd", "https")];
            }
        });

    // load the mpeg-dash or HLS stream into the shaka player
    try {
        await player.load(isSafari ? hlsStreamUrl : mpegdashStreamUrl)
        console.log("The stream has now been loaded!");
    } catch (error) {
        onPlayerError(error);
    }
}

// Set polyfills required by shaka
shaka.polyfill.installAll();
// Check browser is supported and load the player.
if (shaka.Player.isBrowserSupported()) {
    if (isSafari) {
        // Get the fairplay certificate, once the cert is retrieved then the player will be loaded.
        getFairplayCertificate();
    } else {
        init();
    }
} else {
    console.error("This browser does not have the minimum set of APIs needed for shaka!");
}

function onPlayerErrorEvent(errorEvent) {
  // Extract the shaka.util.Error object from the event.
  onPlayerError(event.detail);
}

function onPlayerError(error) {
  // Handle player error
  console.error('Error code', error.code, 'object', error);
}

function onUIErrorEvent(errorEvent) {
  // Extract the shaka.util.Error object from the event.
  onPlayerError(event.detail);
}

function initFailed(errorEvent) {
  // Handle the failure to load; errorEvent.detail.reasonCode has a
  // shaka.ui.FailReasonCode describing why.
  console.error('Unable to load the UI library!');
}

// Listen to the custom shaka-ui-loaded event, to wait until the UI is loaded.
document.addEventListener('shaka-ui-loaded', init);
// Listen to the custom shaka-ui-load-failed event, in case Shaka Player fails
// to load (e.g. due to lack of browser support).
document.addEventListener('shaka-ui-load-failed', initFailed);

// (function () {
//     // Set your mpeg dash stream url
//     var mpegdashStreamUrl = "https://d1chyo78gdexn4.cloudfront.net/vualto-demo/sintel/sintel.ism/manifest.mpd";

//     // Set your HLS stream url
//     var hlsStreamUrl = "<hls-stream-url>";

//     // Set your fairplay certificate url
//     var fairplayCertificateUrl = "<fairplay-certificate-url>";

//     // Will get overridden with the one from the manifest but we have to set something otherwise shaka will complain!
//     var fairplayLicenseServerUrl = "https://fairplay-license.vudrm.tech/license";

//     // Please refer to the following documentation for guidance on generating a Studio DRM token: https://developer.jwplayer.com/jwplayer/docs/studio-drm-token-v2
//     var studioDrmToken = "vualto-demo|2022-06-28T11:43:16Z|RAQrLiTYv+Z8U9LrxO0JDw==|4427543ebf604144907fdc42471b18a9c9303242";

//     // A bit of hacky way to detect Safari but will do for demo purposes...
//     var isSafari = (navigator.userAgent.indexOf("Safari") != -1 && navigator.userAgent.indexOf("Chrome") == -1);

//     // const CastService = function (stream, token) {
//     //     this._context;
//     //     this._laurl = 'https://widevine-license.vudrm.tech/proxy';
//     //     this._mimeType = 'application/dash+xm';
//     //     this._remotePlayer;
//     //     this._remotePlayerController;
//     //     this._stream = stream;
//     //     this._token = token;
//     // }
    
//     // CastService.prototype.initCast = function () {
//     //     this._context = cast.framework.CastContext.getInstance()
//     //     this._context.setOptions({
//     //         receiverApplicationId: '9BD166BB',
//     //         autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
//     //     });
    
//     //     this._remotePlayer = new cast.framework.RemotePlayer();
//     //     this._remotePlayerController = new cast.framework.RemotePlayerController(this._remotePlayer);
//     //     this._remotePlayerController.addEventListener(
//     //         cast.framework.RemotePlayerEventType.IS_CONNECTED_CHANGED,
//     //         () => { this.connectionHandler(); },
//     //         false
//     //     );
    
//     //     document.getElementById('play').addEventListener('click', this.play.bind(this));
//     // }
    
//     // CastService.prototype.connectionHandler = function () {
//     //     if (!this._remotePlayer.isConnected) return;
//     //     let mediaInfo = new chrome.cast.media.MediaInfo(this._stream, this._mimeType);
    
//     //     mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
//     //     mediaInfo.metadata.metadataType = chrome.cast.media.MetadataType.GENERIC;
//     //     mediaInfo.metadata.title = 'Vuplay Receiver Demo';
//     //     mediaInfo.customData = { laurl: this._laurl, token: this._token };
    
//     //     let request = new chrome.cast.media.LoadRequest(mediaInfo);
//     //     let session = this._context.getCurrentSession();
//     //     session.loadMedia(request);
//     // }
    
//     // CastService.prototype.play = function () {
        
//     //     this._remotePlayerController.playOrPause();
//     //     // var player = new cast.framework.RemotePlayer();
//     //     // var playerController = new cast.framework.RemotePlayerController(player);
//     //     // playerController.playOrPause();
//     // }

//     // Fetch the fairplay certificate used to generate the fairplay license request
//     function getFairplayCertificate() {
//         var certRequest = new XMLHttpRequest();
//         certRequest.responseType = "arraybuffer";
//         certRequest.open("GET", fairplayCertificateUrl, true);
//         certRequest.onload = function (event) {
//             if (event.target.status == 200) {
//                 loadPlayer(new Uint8Array(event.target.response));
//             } else {
//                 var error = new Error("HTTP status: " + event.target.status + " when getting Fairplay Certificate.");
//                 onError(error);
//             }
//         };
//         certRequest.send();
//     }

//     // Returns a shaka player config for use with mpeg-dash streams
//     function getNonSafariPlayerConfig() {
//         return {
//             drm: {
//                 servers: {
//                     "com.widevine.alpha": "https://widevine-license.vudrm.tech/proxy",
//                     "com.microsoft.playready": "https://playready-license.vudrm.tech/rightsmanager.asmx"
//                 }
//             }
//         }
//     }

//     // returns a shaka player config for use with HLS streams
//     function getSafariPlayerConfig(fairplayCertificate) {
//         return {
//             drm: {
//                 servers: {
//                     "com.apple.fps.1_0": fairplayLicenseServerUrl
//                 },
//                 advanced: {
//                     "com.apple.fps.1_0": {
//                         serverCertificate: fairplayCertificate
//                     }
//                 },
//                 initDataTransform: function (initData, initDataType) {
//                     if (initDataType == "skd") {
//                         // Set the Fairplay license server URL with the one from the HLS manifest
//                         fairplayLicenseServerUrl = shaka.util.StringUtils.fromBytesAutoDetect(initData);
                        
//                         // Create the initData for Fairplay
//                         var contentId = fairplayLicenseServerUrl.split("/").pop();
//                         var certificate = window.shakaPlayerInstance.drmInfo().serverCertificate;
//                         return shaka.util.FairPlayUtils.initDataTransform(initData, contentId, certificate);
//                     } else {
//                         return initData;
//                     }
//                 }
//             }
//         }
//     }

//     function loadPlayer(fairplayCertificate) {
//         // setup the shaka player and attach an error event listener
//         var video = document.getElementById("video");
//         window.shakaPlayerInstance = new shaka.Player(video);
//         window.shakaPlayerInstance.addEventListener("error", onErrorEvent);

//         // configure the DRM license servers
//         var playerConfig = isSafari ? getSafariPlayerConfig(fairplayCertificate) : getNonSafariPlayerConfig();
//         window.shakaPlayerInstance.configure(playerConfig);

//         // Something special is needed for the widevine license request.
//         window.shakaPlayerInstance
//             .getNetworkingEngine()
//             .registerRequestFilter(function (type, request) {
//                 // ignore requests that are not license requests.
//                 if (type != shaka.net.NetworkingEngine.RequestType.LICENSE)
//                     return;

//                 // set the Studio DRM token as a header on the license request
//                 request.headers["X-VUDRM-TOKEN"] = studioDrmToken;

//                 // custom fairplay license request body required
//                 if (window.shakaPlayerInstance.drmInfo().keySystem == "com.apple.fps.1_0") {
//                     request.headers["Content-Type"] = "ArrayBuffer"
//                     request.uris = [fairplayLicenseServerUrl.replace("skd", "https")];
//                 }
//             });

//         // load the mpeg-dash or HLS stream into the shaka player
//         window.shakaPlayerInstance
//             .load(isSafari ? hlsStreamUrl : mpegdashStreamUrl)
//             .then(function () {
//                 console.log("The stream has now been loaded!");
//             })
//             .catch(onError);
//     }

//     // Set polyfills required by shaka
//     shaka.polyfill.installAll();
//     // Check browser is supported and load the player.
//     if (shaka.Player.isBrowserSupported()) {
//         if (isSafari) {
//             // Get the fairplay certificate, once the cert is retrieved then the player will be loaded.
//             getFairplayCertificate();
//         } else {
//             loadPlayer();
//         }
//     } else {
//         console.error("This browser does not have the minimum set of APIs needed for shaka!");
//     }
// })();

// function onErrorEvent(event) {
//     // Extract the shaka.util.Error object from the event.
//     onError(event.detail);
// }

// function onError(error) {
//     console.error("Error code", error.code, "object", error);
// }
