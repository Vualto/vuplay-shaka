(function() {
    // Set your mpeg dash stream url
    var mpegdashStreamUrl = "<mpeg-dash-stream-url>";

    // Set your HLS stream url
    var hlsStreamUrl = "<hls-strem-url>";

    // Please login to https://admin.drm.technology to generate a vudrm token.
    var vudrmToken = "<vudrm-token>";

    // Set polyfills required by shaka
    shaka.polyfill.installAll();
    if (shaka.Player.isBrowserSupported()) {
        // setup the shaka player and attach an error event listener
        var video = document.getElementById("video");
        window.shakaPlayerInstance = new shaka.Player(video);
        window.shakaPlayerInstance.addEventListener("error", onErrorEvent);

        // configure the DRM license servers
        window.shakaPlayerInstance.configure({
            drm: {
                servers: {
                    "com.widevine.alpha": "https://widevine-license.vudrm.tech/proxy",
                    "com.microsoft.playready": "https://playready-license.vudrm.tech/rightsmanager.asmx"
                }
            }
        });

        // Something special is needed for the widevine license request.
        window.shakaPlayerInstance
            .getNetworkingEngine()
            .registerRequestFilter(function(type, request) {
                // ignore requests that are not license requests.
                if (type != shaka.net.NetworkingEngine.RequestType.LICENSE)
                    return;

                // set the VUDRM token as a header on the license request
                request.headers["X-VUDRM-TOKEN"] = vudrmToken;

                //TODO fairplay
            });

        // load the mpeg-dash stream into the shaka player
        window.shakaPlayerInstance
            .load(mpegdashStreamUrl)
            .then(function() {
                console.log("The stream has now been loaded!");
            })
            .catch(onError);
    } else {
        console.error(
            "This browser does not have the minimum set of APIs needed for shaka!"
        );
    }
})();

function onErrorEvent(event) {
    // Extract the shaka.util.Error object from the event.
    onError(event.detail);
}

function onError(error) {
    console.error("Error code", error.code, "object", error);
}
