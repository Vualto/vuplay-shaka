(function () {
    // Set your mpeg dash stream url
    var mpegdashStreamUrl = "https://d1chyo78gdexn4.cloudfront.net/vualto-demo/vuworkflow/content/vod/jw_prd_xdzmqoww/jw_prd_xdzmqoww_drm_1611503b-805c-4a97-b2d3-d83a287a17a7.ism/manifest.mpd";

    // Set your HLS stream url
    var hlsStreamUrl = "https://d1chyo78gdexn4.cloudfront.net/vualto-demo/vuworkflow/content/vod/jw_prd_xdzmqoww/jw_prd_xdzmqoww_drm_1611503b-805c-4a97-b2d3-d83a287a17a7.ism/manifest.m3u8";

    // Set your fairplay certificate url
    var fairplayCertificateUrl = "https://resources.vudrm.tech/clients/jw_prd_xdzmqoww/jw_prd_xdzmqoww.der";

    // Will get overridden with the one from the manifest
    var fairplayLicenseServerUrl = "https://fairplay-license.vudrm.tech/license";

    // A bit of hacky way to detect Safari but will do for demo purposes...
    var isSafari = (navigator.userAgent.indexOf("Safari") != -1 && navigator.userAgent.indexOf("Chrome") == -1);

    function loadPlayer() {
        // setup the shaka player and attach an error event listener
        var video = document.getElementById("video");
        window.shakaPlayerInstance = new shaka.Player(video);
        window.shakaPlayerInstance.addEventListener("error", onErrorEvent);

        // configure the DRM license servers
        window.shakaPlayerInstance.configure({
            drm: {
                servers: {
                    "com.widevine.alpha": "https://widevine-license.eu-west-2.vudrm.tech/proxy",
                    "com.microsoft.playready": "https://playready-license.eu-west-2.vudrm.tech/rightsmanager.asmx",
                    // Will get overridden with the one from the manifest but we have to set something otherwise shaka will complain!
                    "com.apple.fps.1_0": fairplayLicenseServerUrl
                },
                advanced: {
                    "com.apple.fps.1_0": {
                        serverCertificateUri: fairplayCertificateUrl
                    }
                },
                initDataTransform: function (initData, initDataType, drmInfo) {
                    if (initDataType == "skd") {
                        // Set the Fairplay license server URL with the one from the HLS manifest
                        fairplayLicenseServerUrl = shaka.util.StringUtils.fromBytesAutoDetect(initData).replace("skd", "https");
                        
                        // Create the initData for Fairplay
                        const contentId = fairplayLicenseServerUrl.split("/").pop();
                        const cert = drmInfo.serverCertificate;
                        return shaka.util.FairPlayUtils.initDataTransform(initData, contentId, cert);
                    } else {
                        return initData;
                    }
                }
            }
        });

        // set the Fairplay content type header and set the fairplay license server url extracted from the manifest
        window.shakaPlayerInstance
            .getNetworkingEngine()
            .registerRequestFilter(function (type, request) {
                // ignore requests that are not license requests.
                if (type == shaka.net.NetworkingEngine.RequestType.LICENSE 
                    && window.shakaPlayerInstance.drmInfo().keySystem == "com.apple.fps.1_0") {
                        request.headers["Content-Type"] = "ArrayBuffer"
                        request.uris = [fairplayLicenseServerUrl];
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
    shaka.polyfill.PatchedMediaKeysApple.install(/* enableUninstall= */ true);
    
    // Check browser is supported and load the player.
    if (shaka.Player.isBrowserSupported()) {
        loadPlayer();
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
