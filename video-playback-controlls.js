/**
 * This script handles various interactions and controls for video playback and navigation.
 * It provides functionality for stepping through frames or seconds, enabling scroll-based interaction,
 * and handling key events for playback control and settings toggling.
 */
var videoPlayerDim1 = "88vh";
var videoPlayerDim2 = "96vh";
var videoPlayerDim3 = "83.5vh";


var player = videojs('my-video');
var fps;
var video = player.el().querySelector('video');
player.snapshot();
enableDisableControls(true);
document.getElementById("files").disabled = false;
var currentStep = 1;
var currentSeconds = 1;
var canUseQuickCommands = false;

// Get the switch element for toggling between updating seconds and steps
var switchSeconds = document.getElementById("switchSeconds");
var bUpdateSeconds = true;

// Event listener for toggling between updating seconds and steps
switchSeconds.addEventListener('change', function () {
    bUpdateSeconds = switchSeconds.checked;
});

document.getElementById('current-seconds').addEventListener('input', function (e) {
    currentSeconds = parseInt(e.target.value);
});

document.getElementById('current-step').addEventListener('input', function (e) {
    currentStep = parseInt(e.target.value);
});

function modifyVideoHeight(newHeight) {
    var videoDiv = document.getElementById("video-background");
    videoDiv.style.transition = "height 0.8s";
    videoDiv.style.height = newHeight;
    
}

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
        document.getElementById('current-step').value = currentStep;
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
        document.getElementById('current-seconds').value = currentSeconds;
    }
}

// Event listener for file input change
document.getElementById('files').addEventListener('change', function (event) {
    var file = event.target.files[0];
    player.src({ type: "video/mp4", src: URL.createObjectURL(file) });

    // When changing the file init the fps calculation
    init_calculation();
    modifyVideoHeight(videoPlayerDim1);
}, false);

// Event listener for keydown events
document.addEventListener('keydown', function (event) {
    // Play/pause video with spacebar
    if (canUseQuickCommands) {
        if (event.key === ' ') {
            if (player.paused()) {
                player.play();
            } else {
                player.pause();
            }
        }
    }

    // Toggle fullscreen with 'F' key
    if (event.key === 'f') {
        if (canUseQuickCommands) {
            if (player.isFullscreen()) {
                player.exitFullscreen();
            } else {
                player.requestFullscreen();
            }
        }
    }

    // Skip number of frames/seconds with arrow keys
    if (event.code === "ArrowLeft") {
        if (canUseQuickCommands) {
            event.preventDefault();
            if (bUpdateSeconds) {
                forwardSeconds(-1);
            } else {
                forwardFrames(-1);
            }
        }
    }
    if (event.code === "ArrowRight") {
        if (canUseQuickCommands) {
            event.preventDefault();
            if (bUpdateSeconds) {
                forwardSeconds(1);
            } else {
                forwardFrames(1);
            }
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
    canUseQuickCommands = !value;
}

// Delay opening the tooltip text by 1 second for each question mark
const questionMarks = document.querySelectorAll('.tooltip');
const tooltipTimeouts = new Map();

questionMarks.forEach((questionMark, index) => {

    questionMark.addEventListener('mouseenter', () => {
        tooltipTimeouts.set(index, setTimeout(() => {
            let id = questionMark.id + "-text";
            let tooltipText = document.getElementById(id);
            tooltipText.style.visibility = 'visible';
            tooltipText.style.opacity = '1';

        }, 1000)); // 1000 milliseconds (1 second)
    });

    questionMark.addEventListener('mouseleave', () => {
        clearTimeout(tooltipTimeouts.get(index));
        let id = questionMark.id + "-text";
        let tooltipText = document.getElementById(id);
        tooltipText.style.visibility = 'hidden';
        tooltipText.style.opacity = '0';
    });
});