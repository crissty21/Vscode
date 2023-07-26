var currentStep = 1;
var player = videojs('my-video');
var fps = 30;

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
            // Skip 5 seconds backward when left arrow is pressed
            if (event.which === 37) {
                forwardFrames(-1);
            }
            // Skip 5 seconds forward when right arrow is pressed
            if (event.which === 39) {
                forwardFrames(1);
            }
        });
        
        this.on('keydown', function (event) {
            // Add frames when up arrow is pressed 
            if (event.which === 38) {
                updateStep(1);
            }
            // Subtract frames when down arrow is pressed 
            if (event.which === 40) {
                updateStep(-1);
            }
        });
    });
});

// Function to forward or backward frames
function forwardFrames(direction) {
    player.pause();
    var currentTime = player.currentTime();
    var newTime = currentTime + this.currentStep * 1 / fps * direction;
    player.currentTime(newTime);
}

// Function to update the step size based on the selected option
function updateStep(step) {
    if (currentStep + step != 0) {
        currentStep += step;
        document.getElementById('current-step').textContent = currentStep;
    }
}