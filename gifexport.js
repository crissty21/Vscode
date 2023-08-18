var player = videojs('my-video');
var formatSlider = document.getElementById('slider');
var fps = 30;

var formatForSlider = {
  from: function (formattedValue) {
    return Number(formattedValue);
  },
  to: function (numericValue) {
    return Math.floor(numericValue);
  }
};
// Get reference to the export button and the gif-selector div
var exportButton = document.getElementById("exportButton");
var gifSelectorDiv = document.getElementById("gif-selector");

// Add click event listener to the export button
exportButton.addEventListener("click", function () {
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

function enableDisableControls(value) {
  var buttons = document.querySelectorAll(".buttons-controls");
  buttons.forEach(function (button) {
    button.disabled = value;
  });
  var fileInput = document.getElementById("files");
  fileInput.disabled = value;

}
function destroySlider() {
  slider = document.getElementById('slider');
  delete slider.noUiSlider;
  slider.innerHTML="";
}

function createSlider(){

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
  
  formatSlider.noUiSlider.set(['25.666', '57.66']);
  
  var formatValues = [
    document.getElementById('formatting-start'),
    document.getElementById('formatting-end')
  ];
  
  formatSlider.noUiSlider.on('update', function (values, handle, unencoded) {

    formatValues[handle].innerHTML = "Second: " + values[handle] + "<br>" + 'Frame number: ' + Math.floor(unencoded[handle] * fps);
    player.currentTime(unencoded[handle]);
  });
}