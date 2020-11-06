(function() {
    // Set your mpeg dash stream url
    var mpegdashStreamUrl = "https://tnfba-test-stream-dvr-od.telenorcdn.net/catchup/cdgo_bbc_brit_nordic_live/clear/manifest.isml/.mpd?t=2020-11-04T04:04:00-2020-11-04T05:03:00";

    // Please login to https://admin.drm.technology to generate a vudrm token.
    var vudrmToken = "vualto-demo|2020-11-06T15:38:56Z|RAQrLiTYv+Z8U9LrxO0JDw==|5e3712c0f9efb600a27d2b2fec51eba34551c0cf";

    // Set polyfills required by shaka
    shaka.polyfill.installAll();
    if (shaka.Player.isBrowserSupported()) {
        // setup the shaka player and attach an error event listener
        var video = document.getElementById("video");
        window.shakaPlayerInstance = new shaka.Player(video);
        window.shakaPlayerInstance.addEventListener("error", onErrorEvent);

        // configure the DRM license servers
        var playReadyLaURL =
            "https://playready-license.drm.technology/rightsmanager.asmx?token=" +
            encodeURIComponent(vudrmToken);
        window.shakaPlayerInstance.configure({
            drm: {
                servers: {
                    "com.widevine.alpha":
                        "https://widevine-proxy.drm.technology/proxy",
                    "com.microsoft.playready": playReadyLaURL
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

                // get the selected drm info and check the key system is widevine.
                var selectedDrmInfo = window.shakaPlayerInstance.drmInfo();
                if (selectedDrmInfo.keySystem !== "com.widevine.alpha") {
                    return;
                }

                // select the first key id and convert to uppercase as it is hex.
                var keyId = selectedDrmInfo.keyIds[0].toUpperCase();

                // create the license request body required by the license server
                var body = {
                    token: vudrmToken,
                    drm_info: Array.apply(null, new Uint8Array(request.body)),
                    kid: keyId
                };
                body = JSON.stringify(body);

                // set the request body
                request.body = body;

                // add the content type header
                request.headers["Content-Type"] = "application/json";
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
