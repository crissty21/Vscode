
var currentStep = 1;
var currentSeconds = 1;
var player = videojs('my-video');
var fps = 30;
var switchSeconds = document.getElementById("switchSeconds");
var bUpdateSeconds = true;
var scrollEnabled = false;
var scrollType = 1;

switchSeconds.addEventListener('change', function () {
    if (switchSeconds.checked) {
        bUpdateSeconds = true;
    } else {
        bUpdateSeconds = false;
    }
});

// Function to forward or backward frames
function forwardFrames(direction) {
    player.pause();
    var currentTime = player.currentTime();
    var newTime = currentTime + this.currentStep / fps * direction;
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
    player.pause();
    var currentTime = player.currentTime();
    var newTime = currentTime + this.currentSeconds * direction;
    player.currentTime(newTime);

}

// Function to update the seconds size based
function updateSeconds(step) {
    if (currentSeconds + step != 0) {
        currentSeconds += step;
        document.getElementById('current-seconds').textContent = currentSeconds;
    }

}

document.getElementById('files').addEventListener('change', function (event) {
    var file = event.target.files[0];
    player.src({ type: "video/mp4", src: URL.createObjectURL(file) });
}, false);

function enableScroll(type) {
    scrollEnabled = true;
    scrollType = type;
}

function disableScroll() {
    scrollEnabled = false;
}

document.addEventListener('wheel', (event) => {
    if (scrollEnabled) {
        event.preventDefault();
        const delta = -Math.sign(event.deltaY);
        if (scrollType == 1) {
            updateStep(delta);
        }
        else {
            updateSeconds(delta);
        }
    }
});

document.addEventListener('keydown', function (event) {
    if (event.key === ' ') {
        if (player.paused()) {
            player.play();
        } else {
            player.pause();
        }
    }

    // Toggle fullscreen with F key
    if (event.key === 'f') {
        if (player.isFullscreen()) {
            player.exitFullscreen();
        } else {
            player.requestFullscreen();
        }
    }

    // Skip number of frames/seconds
    if (event.code === "ArrowLeft") {
        event.preventDefault();
        if (bUpdateSeconds) {
            forwardSeconds(-1);
        }
        else {
            forwardFrames(-1);
        }
    }
    if (event.code === "ArrowRight") {
        event.preventDefault();
        if (bUpdateSeconds) {
            forwardSeconds(1);
        }
        else {
            forwardFrames(1);
        }
    }


    // Add frames/seconds when up arrow is pressed 
    if (event.code === "ArrowUp") {
        event.preventDefault();
        if (bUpdateSeconds) {
            updateSeconds(1);
        }
        else {
            updateStep(1);
        }
    }
    // Subtract frames/seconds when down arrow is pressed 
    if (event.code === "ArrowDown") {
        event.preventDefault();
        if (bUpdateSeconds) {
            updateSeconds(-1);
        }
        else {
            updateStep(-1);
        }
    }

    // Switch between frames and seconds using 's'
    if (event.key === 's') {
        bUpdateSeconds = !bUpdateSeconds;
        switchSeconds.checked = bUpdateSeconds;
    }

});