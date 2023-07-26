var currentStep = 1;
var currentSeconds = 1;
var player = videojs('my-video');
var fps = 30;
var switchSeconds = document.getElementById("switchSeconds");
var bUpdateSeconds = true;

switchSeconds.addEventListener('change', function () {
    if (switchSeconds.checked) {
        bUpdateSeconds = true;
    } else {
        bUpdateSeconds = false;
    }
    player.focus();
});

	
document.addEventListener('DOMContentLoaded', function () {

    // Add quick commands
    player.ready(function () {
        // Play/Pause with Space key
        this.on('keydown', function (event) {
            if (event.which === 32) {
                if (this.paused()) {
                    this.play();
                } else {
                    this.pause();
                }
            }
        });

        // Toggle fullscreen with F key
        this.on('keydown', function (event) {
            if (event.which === 70) {
                if (this.isFullscreen()) {
                    this.exitFullscreen();
                } else {
                    this.requestFullscreen();
                }
            }
        });

        this.on('keydown', function (event) {
            if (event.which === 37) {
                if (bUpdateSeconds) {
                    forwardSeconds(-1);
                }
                else {
                    forwardFrames(-1);
                }
            }
            if (event.which === 39) {
                if (bUpdateSeconds) {
                    forwardSeconds(1);
                }
                else {
                    forwardFrames(1);
                }
            }
        });

        this.on('keydown', function (event) {
            // Add frames when up arrow is pressed 
            if (event.which === 38) {
                if (bUpdateSeconds) {
                    updateSeconds(1);
                }
                else {
                    updateStep(1);
                }
            }
            // Subtract frames when down arrow is pressed 
            if (event.which === 40) {
                if (bUpdateSeconds) {
                    updateSeconds(-1);
                }
                else {
                    updateStep(-1);
                }
            }
        });

        this.on('keydown', function (event) {
            if (event.which === 83) {
                bUpdateSeconds = !bUpdateSeconds;
                switchSeconds.checked = bUpdateSeconds;
            }
        });
    });
});

// Function to forward or backward frames
function forwardFrames(direction) {
    player.pause();
    var currentTime = player.currentTime();
    var newTime = currentTime + this.currentStep / fps * direction;
    player.currentTime(newTime);
    player.focus();

}

// Function to update the step size based on the selected option
function updateStep(step) {
    if (currentStep + step != 0) {
        currentStep += step;
        document.getElementById('current-step').textContent = currentStep;
    }
    player.focus();

}
// Function to forward or backward seconds
function forwardSeconds(direction) {
    player.pause();
    var currentTime = player.currentTime();
    var newTime = currentTime + this.currentSeconds * direction;
    player.currentTime(newTime);
    player.focus();

}

// Function to update the step size based on the selected option
function updateSeconds(step) {
    if (currentSeconds + step != 0) {
        currentSeconds += step;
        document.getElementById('current-seconds').textContent = currentSeconds;
    }
    player.focus();

}
