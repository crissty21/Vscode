/**
 * This script handles various interactions and controls for video playback and navigation.
 * It provides functionality for stepping through frames or seconds, enabling scroll-based interaction,
 * and handling key events for playback control and settings toggling.
 */

var player = videojs('my-video');
var fps;
var video = player.el().querySelector('video');
player.snapshot();
enableDisableControls(true);
document.getElementById("files").disabled = false;
var currentStep = 1;
var currentSeconds = 1;

// Get the switch element for toggling between updating seconds and steps
var switchSeconds = document.getElementById("switchSeconds");
var bUpdateSeconds = true;

var scrollEnabled = false;
var scrollType = 1;

// Event listener for toggling between updating seconds and steps
switchSeconds.addEventListener('change', function () {
    bUpdateSeconds = switchSeconds.checked;
});

// Function to forward or backward frames
function forwardFrames(direction) {
    player.pause();
    var currentTime = player.currentTime();
    var newTime = currentTime + currentStep / fps * direction;
    player.currentTime(newTime);
}

// Function to update the step size
function updateStep(step) {
    if (currentStep + step != 0) {
        currentStep += step;
        document.getElementById('current-step').textContent = currentStep;
    }
}

// Function to forward or backward seconds
function forwardSeconds(direction) {
    player.play();
    player.pause();
    var currentTime = player.currentTime();
    var newTime = currentTime + currentSeconds * direction;
    player.currentTime(newTime);
}

// Function to update the seconds size
function updateSeconds(step) {
    if (currentSeconds + step != 0) {
        currentSeconds += step;
        document.getElementById('current-seconds').textContent = currentSeconds;
    }
}

// Event listener for file input change
document.getElementById('files').addEventListener('change', function (event) {
    var file = event.target.files[0];
    player.src({ type: "video/mp4", src: URL.createObjectURL(file) });

    // When changing the file init the fps calculation
    init_calculation();
    enableDisableControls(false);

}, false);

// Function to enable scroll-based interaction
function enableScroll(type) {
    scrollEnabled = true;
    scrollType = type;
}

// Function to disable scroll-based interaction
function disableScroll() {
    scrollEnabled = false;
}

// Event listener for scroll events
document.addEventListener('wheel', (event) => {
    if (scrollEnabled) {
        event.preventDefault();
        const delta = -Math.sign(event.deltaY);
        if (scrollType == 1) {
            updateStep(delta);
        } else {
            updateSeconds(delta);
        }
    }
});

// Event listener for keydown events
document.addEventListener('keydown', function (event) {
    // Play/pause video with spacebar
    if (event.key === ' ') {
        if (player.paused()) {
            player.play();
        } else {
            player.pause();
        }
    }

    // Toggle fullscreen with 'F' key
    if (event.key === 'f') {
        if (player.isFullscreen()) {
            player.exitFullscreen();
        } else {
            player.requestFullscreen();
        }
    }

    // Skip number of frames/seconds with arrow keys
    if (event.code === "ArrowLeft") {
        event.preventDefault();
        if (bUpdateSeconds) {
            forwardSeconds(-1);
        } else {
            forwardFrames(-1);
        }
    }
    if (event.code === "ArrowRight") {
        event.preventDefault();
        if (bUpdateSeconds) {
            forwardSeconds(1);
        } else {
            forwardFrames(1);
        }
    }

    // Add frames/seconds when up arrow is pressed
    if (event.code === "ArrowUp") {
        event.preventDefault();
        if (bUpdateSeconds) {
            updateSeconds(1);
        } else {
            updateStep(1);
        }
    }
    // Subtract frames/seconds when down arrow is pressed
    if (event.code === "ArrowDown") {
        event.preventDefault();
        if (bUpdateSeconds) {
            updateSeconds(-1);
        } else {
            updateStep(-1);
        }
    }

    // Toggle between frames and seconds using 's'
    if (event.key === 's') {
        bUpdateSeconds = !bUpdateSeconds;
        switchSeconds.checked = bUpdateSeconds;
    }
});
function enableDisableControls(value) {
    var buttons = document.querySelectorAll(".buttons-controls");
    buttons.forEach(function (button) {
        button.disabled = value;
    });
    document.getElementById("files").disabled = value;
}

