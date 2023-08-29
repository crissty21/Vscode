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
const formatSlider = document.getElementById('slider');
const exportButton = document.getElementById("exportButton");
const gifSelectorDiv = document.getElementById("gif-selector");
const formattingStart = document.getElementById('formatting-start');
const formattingEnd = document.getElementById('formatting-end');
// Keep track of the button state
let isExtractButtonVisible = false;
let draggingSlider = true;
var startTime = 0;
var endTime = 1;
var formatValues = [
  formattingStart,
  formattingEnd
];

var handles; 

formattingStart.addEventListener('input', handleStartFrameInputChange);
formattingEnd.addEventListener('input', handleEndFrameInputChange);

const qualityInput = document.getElementById('quality');
const delayInput = document.getElementById('delay');
const resolutionWidthInput = document.getElementById('resolutionWidth');
const resolutionHeightInput = document.getElementById('resolutionHeight');
const loopingSelect = document.getElementById('looping');


qualityInput.value = 5;
delayInput.value = 200;
loopingSelect.value = 0;
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
    resolutionHeightInput.value = video.videoHeight;
    resolutionWidthInput.value = video.videoWidth;
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
  resolutionWidthInput.max = video.videoWidth;
  resolutionHeightInput.max = video.videoHeight;

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
    if(draggingSlider)
    {
      startTime = unencoded[0];
      endTime = unencoded[1];
      formatValues[handle].value = Math.floor(unencoded[handle] * fps);
      player.currentTime(unencoded[handle]);
    }
  });

  handles = slider.querySelectorAll('.noUi-handle');

// Attach a click event listener to each handle
handles.forEach(handle => {
    handle.addEventListener('mousedown', handleClick);
});

// Event handler for handle click
function handleClick(event) {
    draggingSlider = true;
}

}


document.getElementById('extractButton').addEventListener('click', function () {
  const gif = new GIF({
    workers: 5,
    quality: qualityInput.value,
    looping: loopingSelect.value
  });

  player.currentTime(startTime);

  function captureFrame() {
    if (player.currentTime() < endTime) {
      const canvas = document.createElement('canvas');
      canvas.width = resolutionWidthInput.value;
      canvas.height = resolutionHeightInput.value;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      gif.addFrame(canvas, { delay: delayInput.value }); // You can adjust the delay as needed
      player.currentTime(player.currentTime() + delayInput.value / 1000); // Capture frames every 0.2 seconds
      setTimeout(captureFrame, 100);
    } else {
      gif.render();
    }
  }

  captureFrame();

  gif.on('finished', function (blob) {
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
  const properties = document.getElementById('properties');
  if (isExtractButtonVisible) {
    properties.style.display = "none";
    container.style.display = 'none';
  } else {
    properties.style.display = "block";
    container.style.display = 'block';
  }
  isExtractButtonVisible = !isExtractButtonVisible;
}

function handleStartFrameInputChange(event) {
  draggingSlider = false;
  // Get the input element that triggered the event
  const inputElement = event.target;

  // Get the new value from the input
  var newValue = parseInt(inputElement.value);
  if (newValue >= parseInt(formattingEnd.value)) {
    formattingStart.value = formattingEnd.value - 1;
    newValue = formattingStart.value;
  }

  formattingStart.value = newValue;

  formatSlider.noUiSlider.set([(newValue / fps).toFixed(1), (formattingEnd.value / fps).toFixed(1)]);
  
}

function handleEndFrameInputChange(event) {
  draggingSlider = false;

  // Get the input element that triggered the event
  const inputElement = event.target;

  // Get the new value from the input
  var newValue = parseInt(inputElement.value);

  if (newValue <= parseInt(formattingStart.value)) {
    formattingEnd.value = formattingStart.value+1;
    newValue = formattingStart.value;

  }
  formatSlider.noUiSlider.set([(formattingStart.value / fps).toFixed(1), (newValue / fps).toFixed(1)]);

}