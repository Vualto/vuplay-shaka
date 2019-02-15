// myapp.js

var manifestUri =
    "https://d3s2m20z4djjuz.cloudfront.net/content/vod/bedca948-cbe0-19e0-cb89-57ff6f87569a/bedca948-cbe0-19e0-cb89-57ff6f87569a_nodrm_8ed25cc9-09a3-446a-a82a-deb6ea329e34.ism/.mpd";

function initApp() {
    // Install built-in polyfills to patch browser incompatibilities.
    shaka.polyfill.installAll();

    // Check to see if the browser supports the basic APIs Shaka needs.
    if (shaka.Player.isBrowserSupported()) {
        // Everything looks good!
        initPlayer();
    } else {
        // This browser does not have the minimum set of APIs we need.
        console.error("Browser not supported!");
    }
}

function initPlayer() {
    // Create a Player instance.
    var videoEl = document.getElementById("video");
    var player = new shaka.Player(videoEl);

    // Attach player to the window to make it easy to access in the JS console.
    window.videoEl = videoEl;
    window.player = player;

    // Listen for error events.
    player.addEventListener("error", onErrorEvent);
    videoEl.addEventListener("canplay", onCanPlayEvent);

    // Try to load a manifest.
    // This is an asynchronous process.
    player
        .load(manifestUri)
        .then(function() {
            // This runs if the asynchronous load is successful.
            console.log("The video has now been loaded!");
        })
        .catch(onError); // onError is executed if the asynchronous load fails.
}

function onErrorEvent(event) {
    // Extract the shaka.util.Error object from the event.
    onError(event.detail);
}

function onError(error) {
    // Log the error.
    console.error("Error code", error.code, "object", error);
}

function onCanPlayEvent(event) {
    videoEl.addEventListener("timeupdate", onTimeUpdateEvent);
}

function onTimeUpdateEvent(event) {
    var utcISO = document.getElementById("utc-iso");
    var elapsedSeconds = document.getElementById("elapsed-seconds");

    var currentlyElapsed = video.currentTime;
    console.log("Current elapsed", currentlyElapsed);
    elapsedSeconds.innerHTML = currentlyElapsed;

    var currentUTC = getCurrentUTC();
    if (!!currentUTC) {
        console.log("Current UTC", getCurrentUTC());
        utcISO.innerHTML = new Date(currentUTC).toJSON();
    }
}

function getCurrentUTC() {
    var programStart = getStartTimeOffset() * 1000;
    var currentPlayheadAsDate = player.getPlayheadTimeAsDate();
    if (!currentPlayheadAsDate) {
        return;
    }
    var currentTime = currentPlayheadAsDate.getTime();

    var playHeadDate = new Date(programStart + currentTime);
    return playHeadDate;
}

function getStartTimeOffset() {
    var currentVariant = player.getVariantTracks().find(function(variantTrack) {
        return variantTrack.active;
    });

    if (!currentVariant) {
        return;
    }

    var periods = player.getManifest().periods;
    if (!periods.length) {
        return;
    }

    var variants = periods[0].variants;
    if (!variants.length) {
        return;
    }

    var currentPariodeVariant = variants.find(function(periodeVariant) {
        return currentVariant.id === periodeVariant.id;
    });

    if (
        !currentPariodeVariant.video ||
        isNaN(currentPariodeVariant.video.presentationTimeOffset)
    ) {
        return;
    }

    return currentPariodeVariant.video.presentationTimeOffset;
}

document.addEventListener("DOMContentLoaded", initApp);
