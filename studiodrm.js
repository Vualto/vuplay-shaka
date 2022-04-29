(function () {
    // Set your mpeg dash stream url
    var mpegdashStreamUrl = "https://d1chyo78gdexn4.cloudfront.net/vualto-demo/sintel/sintel.ism/manifest.mpd";

    // Set your HLS stream url
    var hlsStreamUrl = "<hls-stream-url>";

    // Set your fairplay certificate url
    var fairplayCertificateUrl = "<fairplay-certificate-url>";

    // Will get overridden with the one from the manifest but we have to set something otherwise shaka will complain!
    var fairplayLicenseServerUrl = "https://fairplay-license.vudrm.tech/license";

    // Please refer to the following documentation for guidance on generating a Studio DRM token: https://developer.jwplayer.com/jwplayer/docs/studio-drm-token-v2
    var studioDrmToken = "<your-studiodrm-token>";

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

    function loadPlayer(fairplayCertificate) {
        // setup the shaka player and attach an error event listener
        var video = document.getElementById("video");
        window.shakaPlayerInstance = new shaka.Player(video);
        window.shakaPlayerInstance.addEventListener("error", onErrorEvent);

        // configure the DRM license servers
        var playerConfig = isSafari ? getSafariPlayerConfig(fairplayCertificate) : getNonSafariPlayerConfig();
        window.shakaPlayerInstance.configure(playerConfig);

        // Something special is needed for the widevine license request.
        window.shakaPlayerInstance
            .getNetworkingEngine()
            .registerRequestFilter(function (type, request) {
                // ignore requests that are not license requests.
                if (type != shaka.net.NetworkingEngine.RequestType.LICENSE)
                    return;

                // set the Studio DRM token as a header on the license request
                request.headers["X-VUDRM-TOKEN"] = studioDrmToken;

                // custom fairplay license request body required
                if (window.shakaPlayerInstance.drmInfo().keySystem == "com.apple.fps.1_0") {
                    request.headers["Content-Type"] = "ArrayBuffer"
                    request.uris = [fairplayLicenseServerUrl.replace("skd", "https")];
                }
            });

        // load the mpeg-dash or HLS stream into the shaka player
        window.shakaPlayerInstance
            .load(isSafari ? hlsStreamUrl : mpegdashStreamUrl)
            .then(function () {
                console.log("The stream has now been loaded!");
            })
            .catch(onError);
    }

    // Set polyfills required by shaka
    shaka.polyfill.installAll();
    // Check browser is supported and load the player.
    if (shaka.Player.isBrowserSupported()) {
        if (isSafari) {
            // Get the fairplay certificate, once the cert is retrieved then the player will be loaded.
            getFairplayCertificate();
        } else {
            loadPlayer();
        }
    } else {
        console.error("This browser does not have the minimum set of APIs needed for shaka!");
    }
})();

function onErrorEvent(event) {
    // Extract the shaka.util.Error object from the event.
    onError(event.detail);
}

function onError(error) {
    console.error("Error code", error.code, "object", error);
}
