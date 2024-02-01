/**
 * This script handles various interactions and controls for video playback and navigation.
 * It provides functionality for stepping through frames or seconds, enabling scroll-based interaction,
 * and handling key events for playback control and settings toggling.
 */

var currentHeigth;
var videoPlayerDim = [0,0,0,0];

var player = videojs('my-video');
var fps;
var video = player.el().querySelector('video');
player.snapshot();
enableDisableControls(true);
document.getElementById("files").disabled = false;
var currentStep = 1;
var currentSeconds = 1;
var canUseQuickCommands = false;
const dropdown = document.getElementById('videoDropdown');

// Get the switch element for toggling between updating seconds and steps
var switchSeconds = document.getElementById("switchSeconds");
var bUpdateSeconds = true;


window.onload = function() {
    var div1 = document.getElementById('video-background');
    var div2 = document.getElementById('second-div');
    var div3 = document.getElementById('third-div');

   
    var height2 = div2.offsetHeight;
    var viewportHeight = window.innerHeight;
    var height3 = div3.offsetHeight;

    var height1 = viewportHeight - height2 - height3 - 30;
    div1.style.height = height1 + 'px';
    currentHeigth = 0;

    function adjustHeights(){
        viewportHeight = window.innerHeight;
        videoPlayerDim[0] = (viewportHeight - height2 - height3 - 30) + 'px';
        videoPlayerDim[1] = (viewportHeight - height2 - 30) + 'px';
        videoPlayerDim[2] = (viewportHeight - 30) + 'px';
        videoPlayerDim[3] = (viewportHeight - 150) + 'px';
        modifyVideoHeight(currentHeigth)
    }
    
    //videoPlayerDim3 = "83.5vh";
    adjustHeights();
    window.onresize = adjustHeights;

    loadVideo();
}   

function loadVideo() {
    // Obțineți parametrul video din URL
    var urlParams = new URLSearchParams(window.location.search);
    var videoPath = urlParams.get('video');

    if (videoPath) {
        loadVideoFromPath(videoPath);
    }
}

fetch('/get-videos')
            .then(response => response.json())
            .then(videos => {
                videos.forEach(video => {
                    const option = document.createElement('option');
                    option.value = video;
                    option.text = video;
                    dropdown.add(option);
                });
            });

dropdown.addEventListener('change', (event) => {
    loadVideoFromPath("videos/" + event.target.value)
});

// Event listener for toggling between updating seconds and steps
switchSeconds.addEventListener('select', function () {
    bUpdateSeconds = switchSeconds.checked;
});

document.getElementById('current-seconds').addEventListener('input', function (e) {
    currentSeconds = parseInt(e.target.value);
});

document.getElementById('current-step').addEventListener('input', function (e) {
    currentStep = parseInt(e.target.value);
});


function loadVideoFromPath(videoPath) {
    sendPathToServer(videoPath);

    // Function to send the path to the Flask server
    function sendPathToServer(path) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "set_video_path", true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        // Send the path as JSON data
        xhr.send(JSON.stringify({ path: path }));

        // You can also add a handler for the server response if needed
        xhr.onload = function () {
            if (xhr.status === 200) {
                console.log("Path to file sent successfully!");
            } else {
                console.error("Error sending the file path.");
            }
        };
    }
    
    fetch('/video')
    .then(response => response.blob())
    .then(video => {
        var url = URL.createObjectURL(video);
        player.src({ type: "video/mp4", src: url });
    })
    .catch(error => console.error('A apărut o eroare:', error));
    // Get the video element and set the source on page load
    
    init_calculation();
    modifyVideoHeight(1);
}

function modifyVideoHeight(newHeight) {
    var videoDiv = document.getElementById("video-background");
    videoDiv.style.transition = "height 0.8s";
    videoDiv.style.height = videoPlayerDim[newHeight];
    currentHeigth = newHeight;
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
    modifyVideoHeight(1);
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