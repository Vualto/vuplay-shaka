(function () {
    // Set your mpeg dash stream url
    var mpegdashStreamUrl = "https://d1chyo78gdexn4.cloudfront.net/vualto-demo/tomorrowland2015/tomorrowland2015.ism/manifest.mpd";

    // Please login to https://admin.vudrm.tech to generate a vudrm token.
    var vudrmToken = "vualto-demo|2022-02-18T13:50:40Z|v2|WdN04P3cGLhXVMP32EdI4g0/lY3f0GEzQbo4gngGVqxeQv0zTO7zNgMBq7LyV/0KkT8O84Y5wAJjEITGjqlmhg==|233ba637b81f241553b08a7d44bfa59c7c9a1ef201b2a824482d592c70b9fb08";

    var video = document.getElementById("video");
    window.shakaPlayerInstance = new shaka.Player(video);
    window.shakaPlayerInstance.addEventListener("error", onErrorEvent);
    window.shakaPlayerInstance.configure({
        drm: {
            servers: {
                "com.widevine.alpha": "https://widevine-license.staging.vudrm.tech/proxy",
                "com.microsoft.playready": "https://playready-license.vudrm.tech/rightsmanager.asmx"
            }
        }
    });

    window.shakaPlayerInstance.getNetworkingEngine()
        .registerRequestFilter(function (type, request) {
            // ignore requests that are not license requests.
            if (type != shaka.net.NetworkingEngine.RequestType.LICENSE)
                return;

            // set the VUDRM token as a header on the license request
            request.headers["X-VUDRM-TOKEN"] = vudrmToken;
        });

    window.shakaPlayerInstance.getNetworkingEngine()
        .registerResponseFilter(function (type, response) {
            // Only manipulate license responses:
            if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
                console.log("license response found", type, response);
            }
        });

    // load the mpeg-dash or HLS stream into the shaka player
    window.shakaPlayerInstance
        .load(mpegdashStreamUrl)
        .then(function () {
            console.log("The stream has now been loaded!");
        })
        .catch(onError);

    // Set polyfills required by shaka
    shaka.polyfill.installAll();
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
