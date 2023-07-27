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
    player.focus();
});


document.addEventListener('DOMContentLoaded', function () {

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

        // Skip number of frames/seconds
        this.on('keydown', function (event) {
            if (event.which === 37) {
                event.preventDefault();
                if (bUpdateSeconds) {
                    forwardSeconds(-1);
                }
                else {
                    forwardFrames(-1);
                }
            }
            if (event.which === 39) {
                event.preventDefault();
                if (bUpdateSeconds) {
                    forwardSeconds(1);
                }
                else {
                    forwardFrames(1);
                }
            }
        });

        this.on('keydown', function (event) {
            // Add frames/seconds when up arrow is pressed 
            if (event.which === 38) {
                event.preventDefault();
                if (bUpdateSeconds) {
                    updateSeconds(1);
                }
                else {
                    updateStep(1);
                }
            }
            // Subtract frames/seconds when down arrow is pressed 
            if (event.which === 40) {
                event.preventDefault();
                if (bUpdateSeconds) {
                    updateSeconds(-1);
                }
                else {
                    updateStep(-1);
                }
            }
        });

        // Switch between frames and seconds using 's'
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

// Function to update the step size 
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

// Function to update the seconds size based
function updateSeconds(step) {
    if (currentSeconds + step != 0) {
        currentSeconds += step;
        document.getElementById('current-seconds').textContent = currentSeconds;
    }
    player.focus();

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
        const delta = -Math.sign(event.deltaY);
        if (scrollType == 1) {
            updateStep(delta);
        }
        else {
            updateSeconds(delta);
        }
    }
});


function shoot() {
    player.pause();
    var video = player.el().querySelector('video');
    var w = video.videoWidth;
    var h = video.videoHeight;
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    var ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);

    openModal(canvas);
}


    function openModal(canvas) {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');
        const modalImage = document.getElementById('modal-image');
    
        modalOverlay.style.display = 'block';
        
        
        modalImage.innerHTML = "";
        modalImage.appendChild(canvas);
    }


function closeModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    modalOverlay.style.display = 'none';

}

const modalClose = document.getElementById('modal-close');
modalClose.onclick = closeModal;

window.onclick = function (event) {
    const modalOverlay = document.getElementById('modal-overlay');
    if (event.target === modalOverlay) {
        closeModal();
    }
};
