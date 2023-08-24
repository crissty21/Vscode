/**
 * This script handles exporting GIFs
 */

/**
 * to do:
 * add prop for gif export in html such as delay, looping, bitrate, workers, width and height, speed at of frame capture 
 * open gif in new window and save it from there 
 * clean up the gif.js master
 * style for buttons 
 */
var formatSlider = document.getElementById('slider');
var exportButton = document.getElementById("exportButton");
var gifSelectorDiv = document.getElementById("gif-selector");
// Keep track of the button state
let isExtractButtonVisible = false;

var startTime =0;
var endTime = 1;
var formatValues = [
  document.getElementById('formatting-start'),
  document.getElementById('formatting-end')
];

// Format configuration for the slider
var formatForSlider = {
  from: function (formattedValue) {
    return Number(formattedValue);
  },
  to: function (numericValue) {
    return Math.floor(numericValue);
  }
};

// Add click event listener to the export button
exportButton.addEventListener("click", function () {
  showExtractButton();

  // Toggle the visibility of the gif-selector div
  if (gifSelectorDiv.style.display === "none") {
    gifSelectorDiv.style.display = "block";
    createSlider();
    enableDisableControls(true);
  } else {
    gifSelectorDiv.style.display = "none";
    destroySlider();
    enableDisableControls(false);
  }
});

// Function to enable or disable various controls
function enableDisableControls(value) {
  var buttons = document.querySelectorAll(".buttons-controls");
  buttons.forEach(function (button) {
    button.disabled = value;
  });
  var fileInput = document.getElementById("files");
  fileInput.disabled = value;
}

// Function to destroy the slider
function destroySlider() {
  slider = document.getElementById('slider');
  delete slider.noUiSlider;
  slider.innerHTML = "";
}

// Function to create the slider
function createSlider() {
  noUiSlider.create(formatSlider, {
    // Values are parsed as numbers using the "from" function in "format"
    start: ['20.0', '80.0'],
    range: {
      'min': 0,
      'max': player.duration()
    },
    format: formatForSlider,
    tooltips: {
      // tooltips are output only, so only a "to" is needed
      to: function (numericValue) {
        return numericValue.toFixed(1);
      }
    }
  });

  formatSlider.noUiSlider.set([player.currentTime(), player.duration()]);

  formatSlider.noUiSlider.on('update', function (values, handle, unencoded) {
    startTime = unencoded[0];
    endTime = unencoded[1];
    formatValues[handle].innerHTML = "Second: " + values[handle] + "<br>" + 'Frame number: ' + Math.floor(unencoded[handle] * fps);
    player.currentTime(unencoded[handle]);
  });
}


document.getElementById('extractButton').addEventListener('click', function () {
  const gif = new GIF({
      workers: 5,
      quality: 5,
      looping: 1
  });

  player.currentTime(startTime);

  function captureFrame() {
      if (player.currentTime() < endTime) {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height =  video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          gif.addFrame(canvas, { delay: 100 }); // You can adjust the delay as needed
          player.currentTime(player.currentTime() + 0.2); // Capture frames every 0.2 seconds
          setTimeout(captureFrame, 100);
      } else {
          gif.render();
      }
  }

  captureFrame();
  
  gif.on('finished', function(blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'output.gif';
      a.textContent = 'Download GIF';
      document.body.appendChild(a);
      window.open(URL.createObjectURL(blob));
  });
});

// Function to toggle the visibility of the "Extract" button
function showExtractButton() {
  const container = document.getElementById('extractButtonContainer');
  if (isExtractButtonVisible) {
      container.style.display = 'none';
  } else {
      container.style.display = 'block';
  }
  isExtractButtonVisible = !isExtractButtonVisible;
}