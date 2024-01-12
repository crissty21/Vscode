/**
 * This script handles exporting GIFs
 */

const formatSlider = document.getElementById('slider');
const exportButton = document.getElementById("exportButton");
const cancelButton = document.getElementById("cancelButton");
const gifSelectorDiv = document.getElementById("gif-selector");
const formattingStart = document.getElementById('formatting-start');
const formattingEnd = document.getElementById('formatting-end');
const loadingOverlay = document.getElementById('loadingOverlay');
const progressBar = document.getElementById('progressBar');
const progressBarText = document.getElementById('progressBarText');
const qualityInput = document.getElementById('quality');
const delayInput = document.getElementById('delay');
const resolutionWidthInput = document.getElementById('resolutionWidth');
const resolutionHeightInput = document.getElementById('resolutionHeight');
const downloadButton = document.getElementById('downloadButton');
//const loopingSelect = document.getElementById('looping');
const resetButon = document.getElementById('resetButton');
const downloadLink = document.createElement('a');
let isExtractButtonVisible = false;
let draggingSlider = true;
let startTime = 0;
let endTime = 1;
let handles;
let formatValues = [formattingStart, formattingEnd];
// Format configuration for the slider
let formatForSlider = {
  from: function (formattedValue) {
    return Number(formattedValue);
  },
  to: function (numericValue) {
    return Math.floor(numericValue);
  }
};

formattingStart.addEventListener('change', handleStartFrameInputChange);
formattingEnd.addEventListener('change', handleEndFrameInputChange);

qualityInput.value = 5;
delayInput.value = 30;
//loopingSelect.value = 0;
downloadButton.style.display = "none";
downloadLink.style.display = 'none';
// Add click event listener to the export button
exportButton.addEventListener("click", function () {
  canSnapshot = false;
  showExtractButton();
  player.play();
  player.pause();
  // Toggle the visibility of the gif-selector div
  gifSelectorDiv.style.display = "block";
  resolutionHeightInput.value = video.videoHeight;
  resolutionWidthInput.value = video.videoWidth;
  createSlider();
  exportButton.style.display = "none";
  modifyVideoHeight("83.5vh");
});

cancelButton.addEventListener("click", function () {
  canSnapshot = true;
  gifSelectorDiv.style.display = "none";
  destroySlider();
  enableDisableControls(false);
  exportButton.style.display = "block";
  showExtractButton();
  downloadButton.style.display='none';
  modifyVideoHeight("88vh");
});

resetButon.addEventListener('click', function () {
  resolutionHeightInput.value = video.videoHeight;
  resolutionWidthInput.value = video.videoWidth;
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

//Slider creation proccess 

function createSlider() {
  resolutionWidthInput.max = video.videoWidth;
  resolutionHeightInput.max = video.videoHeight;

  noUiSlider.create(formatSlider, {
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
    if (draggingSlider) {
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

// Function to destroy the slider
function destroySlider() {
  slider = document.getElementById('slider');
  delete slider.noUiSlider;
  slider.innerHTML = "";
}


function handleStartFrameInputChange(event) {
  draggingSlider = false;
  // Get the input element that triggered the event
  const inputElement = event.target;

  // Get the new value from the input
  let newValue = parseInt(inputElement.value);
  if (newValue >= parseInt(formattingEnd.value)) {
    formattingStart.value = formattingEnd.value - 1;
    newValue = formattingStart.value;
  }

  formattingStart.value = newValue;
  formatSlider.noUiSlider.set([(newValue / fps).toFixed(1), (formattingEnd.value / fps).toFixed(1)]);
  startTime = (newValue / fps).toFixed(1);
}

function handleEndFrameInputChange(event) {
  draggingSlider = false;

  // Get the input element that triggered the event
  const inputElement = event.target;

  // Get the new value from the input
  let newValue = parseInt(inputElement.value);

  if (newValue <= parseInt(formattingStart.value)) {
    formattingEnd.value = parseInt(formattingStart.value) + 1;
    newValue = formattingStart.value;
  }
  formatSlider.noUiSlider.set([(formattingStart.value / fps).toFixed(1), (newValue / fps).toFixed(1)]);
  endTime = (newValue / fps).toFixed(1);
}


// Gif creation process 

document.getElementById('extractButton').addEventListener('click', function () {
  const gif = new GIF({
    workers: 5,
    quality: qualityInput.value,
    //looping: -1 not working
  });

  // Show the loading overlay
  loadingOverlay.style.display = 'block';
  // Simulate GIF creation progress
  const totalTime = endTime - startTime;
  progressBarText.innerHTML = "Creating GIF, please wait...";
  player.currentTime(startTime);

  function captureFrame() {
    let delayMs = (1 / fps) * delayInput.value
    if (player.currentTime() < endTime) {
      const canvas = document.createElement('canvas');
      canvas.width = resolutionWidthInput.value;
      canvas.height = resolutionHeightInput.value;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      gif.addFrame(canvas, { delay: delayMs });
      player.currentTime(player.currentTime() + delayMs);
      setTimeout(captureFrame, 100);
      // Update progress bar
      progressBar.value = 100 - ((endTime - player.currentTime()) / totalTime) * 100;
    } else {
      gif.render();
    }
  }

  captureFrame();

  gif.on('progress', function (p) {
    progressBarText.innerHTML = "The GIF is being rendered: " + Math.round(p * 100) + "%<br>Please wait !";
  });

  gif.on('finished', function (blob) {
    const currentDateTime = new Date();
    const timestamp = currentDateTime.toISOString().replace(/[-T:.Z]/g, '');
    const filename = `generated_at_${timestamp}.gif`;
    const url = URL.createObjectURL(blob);
    window.open(url);
    loadingOverlay.style.display = 'none';
    downloadButton.style.display = 'block';
    downloadLink.href = url;
    downloadLink.download = filename; 
    
  });
});

downloadButton.addEventListener('click', ()=>{
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
});
