// This file takes care of the snapshot functionality, including the drawing tools

function snapshot() {
	var player = this; // Reference to the Video.js player instance
	var container, scale; // Variables for canvas container and scaling
	var tool = 'brush'; // Default drawing tool is the brush
	var drawCtrl, parent; // Variables for drawing control and parent element
	var colorButton, sizeButton; // Variables for color and size selectors
	var scale_txt; // Variable for displaying the current scale
	var canvas_bg, context_bg; // Variables for the background canvas
	var canvas_draw, context_draw; // Variables for the drawing canvas
	var canvas_shape, context_shape; // Variables for the shape canvas
	var cropbox, textbox; // Variables for crop box and text box
	var paint = false; // Flag to indicate if drawing is in progress
	var startX, startY, currentX, currentY; // Variables for tracking mouse coordinates


	player.snap = snap;

	createBase();
	createColorButton();
	createSizeButton();
	createToolsButtons();
	createScalerButton();
	createJpegPngButton();
	createCloseButton();
	createScaleText();
	createBackgroundCanvas();
	createDrawCanvas();
	createShapeCanvas();
	drawCropbox();
	drawTextbox();

	parent.hide();
	canvas_shape.hide();
	cropbox.hide();
	textbox.hide();

	container.on('mousedown', function (e) { drawClick(e) });
	container.on('mousemove', function (e) { mouseMove(e) });
	container.on('mouseup', finish);
	container.on('mouseleave', finish);

	
	// Function to initialize the snapshot mode
	function snap() {
		enableDisableControls(true); // Disable controls
		player.pause(); 
		player.el().blur(); 
		player.controlBar.hide(); // Hide the video's control bar
		drawCtrl.show(); // Show the drawing control bar
		parent.show(); // Show the parent container

		// Set up the drawing canvas
		canvas_draw.el().width = video.videoWidth;
		canvas_draw.el().height = video.videoHeight;
		context_draw.strokeStyle = colorButton.el().value;
		context_draw.lineWidth = sizeButton.el().value / 2;
		context_draw.lineCap = "round";

		// Set up the shape canvas
		canvas_shape.el().width = video.videoWidth;
		canvas_shape.el().height = video.videoHeight;
		context_shape.strokeStyle = colorButton.el().value;
		context_shape.lineWidth = sizeButton.el().value / 2;
		context_shape.lineCap = "square";

		updateScale();

		// Set up the background canvas with a snapshot from the video
		canvas_bg.el().width = video.videoWidth;
		canvas_bg.el().height = video.videoHeight;
		context_bg.drawImage(video, 0, 0);

		// Ensure that canvas elements fit into the player element
		var rect = video.getBoundingClientRect();
		canvas_draw.el().style.maxWidth = rect.width + "px";
		canvas_draw.el().style.maxHeight = rect.height + "px";
		canvas_bg.el().style.maxWidth = rect.width + "px";
		canvas_bg.el().style.maxHeight = rect.height + "px";
		canvas_shape.el().style.maxWidth = rect.width + "px";
		canvas_shape.el().style.maxHeight = rect.height + "px";
	}

	// Function to update the scale display
	function updateScale() {
		var rect = video.getBoundingClientRect();
		var scalew = canvas_draw.el().width / rect.width;
		var scaleh = canvas_draw.el().height / rect.height;
		scale = Math.max(Math.max(scalew, scaleh), 1);
		scale_txt.el().innerHTML = (Math.round(1 / scale * 100) / 100) + "x";
	}

	// Function to create buttons for drawing tools
	/*
	- Creating individual tool buttons using the ToolButton component.
	- Each button is added as a child to drawCtrl, a control bar for drawing.
	- The brush button is marked active with the class vjs-tool-active.
	*/

	function createToolsButtons() {
		var brush = drawCtrl.addChild(new videojs.ToolButton(player, { tool: "brush", title: "freehand drawing" }));
		drawCtrl.addChild(new videojs.ToolButton(player, { tool: "line", title: "draw line" }));
		drawCtrl.addChild(new videojs.ToolButton(player, { tool: "rect", title: "draw rectangle" }));
		drawCtrl.addChild(new videojs.ToolButton(player, { tool: "arrow", title: "draw arrow" }));
		drawCtrl.addChild(new videojs.ToolButton(player, { tool: "crop", title: "select area and click selection to crop" }));
		drawCtrl.addChild(new videojs.ToolButton(player, { tool: "text", title: "select area, type message and then click somewhere else" }));
		drawCtrl.addChild(new videojs.ToolButton(player, { tool: "eraser", title: "erase drawing in clicked location" }));
		brush.addClass("vjs-tool-active"); // Set the brush tool as active initially
	}

	// Function to handle tool change
	function toolChange(event) {
		var active_tool = drawCtrl.el().querySelector('.vjs-tool-active');
		active_tool.classList.remove('vjs-tool-active');
		event.target.classList.add('vjs-tool-active');
		tool = event.target.dataset.value;
		cropbox.hide(); // Hide the crop box when changing tools
	}

	// Function to combine the background and drawing canvases into an image
	/*
	- Merging background and drawing canvases into a new canvas.
	- Opening a new window with the merged image in JPEG or PNG format, depending on the specified encoding.
	- The image is displayed in the new window, allowing the user to right-click and save it.
	*/

	function combineDrawing(encoding) {
		// Create a temporary canvas to merge the background and drawing canvases
		var canvas_tmp = document.createElement('canvas');
		canvas_tmp.width = canvas_draw.el().width;
		canvas_tmp.height = canvas_draw.el().height;
		var ctx_tmp = canvas_tmp.getContext("2d");
		ctx_tmp.drawImage(canvas_bg.el(), 0, 0);
		ctx_tmp.drawImage(canvas_draw.el(), 0, 0);

		// Open a new window with the encoded image
		var imgWindow = window.open("");
		imgWindow.document.write('<html><head><title>snapshot - ' + encoding + '</title></head><body><p>Right-click and save image.</p><img src="' + canvas_tmp.toDataURL(encoding) + '" /></body></html>');
	}

	// Function to scale and crop a canvas
	/*
	- Takes a section of a canvas (defined by left, top, width, and height) and creates a new canvas containing the cropped content.
	- Resizes the new canvas to the specified new width and new height.
	- Replaces the original canvas with the new cropped and resized canvas.
	- Returns the new canvas and its associated 2D context.
	*/
	function scaleCropCanvas(left, top, width, height, newwidth, newheight, canvas, context) {
		// Create a new canvas
		var newcanvas = new videojs.Component(player, { el: videojs.Component.prototype.createEl('canvas', {}) });

		// Set the maximum width and height for the new canvas
		var rect = player.el().getBoundingClientRect();
		newcanvas.el().style.maxWidth = rect.width + "px";
		newcanvas.el().style.maxHeight = rect.height + "px";
		newcanvas.el().width = newwidth;
		newcanvas.el().height = newheight;

		// Copy the cropped content to the new canvas
		var ctx = newcanvas.el().getContext("2d");
		ctx.drawImage(canvas.el(), left, top, width, height, 0, 0, newwidth, newheight);

		// Replace the old canvas with the new one
		container.removeChild(canvas);
		container.addChild(newcanvas);

		// Set the line properties for the new canvas
		ctx.lineCap = context.lineCap;
		ctx.strokeStyle = context.strokeStyle;
		ctx.lineWidth = context.lineWidth;

		return [newcanvas, ctx];
	}

	// Function to handle clicking on the crop box
	/*
	- Retrieves the dimensions and position of the cropbox in scaled coordinates.
	- Calls scaleCropCanvas to crop the background and drawing canvases to match the dimensions of the cropbox.
	- Updates the scale and hides the cropbox.
	- Handles the click event for cropping a selected area of the canvas.
	*/

	function cropboxClick(e) {
		var left = scale * cropbox.el().offsetLeft | 0;
		var top = scale * cropbox.el().offsetTop | 0;
		var width = scale * cropbox.el().offsetWidth | 0;
		var height = scale * cropbox.el().offsetHeight | 0;

		// Scale and crop the background and drawing canvases
		var r = scaleCropCanvas(left, top, width, height, width, height, canvas_bg, context_bg);
		canvas_bg = r[0]; context_bg = r[1];
		r = scaleCropCanvas(left, top, width, height, width, height, canvas_draw, context_draw);
		canvas_draw = r[0]; context_draw = r[1];

		updateScale();
		cropbox.hide(); // Hide the crop box after cropping
		e.stopPropagation();
	}

	// Function to draw text on the drawing canvas
	function drawText() {
		context_draw.fillStyle = colorButton.el().value;
		context_draw.font = (scale * sizeButton.el().value * 2) + "px sans-serif";
		context_draw.textBaseline = "top";
		context_draw.fillText(textbox.el().value,
			scale * textbox.el().offsetLeft + scale,
			scale * textbox.el().offsetTop + scale);
		textbox.hide(); 
		textbox.el().value = ""; 
	}

	// Function to draw an arrow on a canvas
	function drawArrow(context, startX, startY, endX, endY) {
		context.lineCap = "square";
		context.beginPath();

		context.moveTo(startX, startY);
		context.lineTo(endX, endY);

		// Calculate properties for drawing the arrowhead
		var arrowSize = sizeButton.el().value / scale * 2;
		var angle = Math.atan2(endY - startY, endX - startX); // Angle of arrow direction
		var arrowEndX = endX - arrowSize * Math.cos(angle - Math.PI / 6); // Arrowhead endpoint X
		var arrowEndY = endY - arrowSize * Math.sin(angle - Math.PI / 6); // Arrowhead endpoint Y
		var arrowStartX = endX - arrowSize * Math.cos(angle + Math.PI / 6); // Arrowhead startpoint X
		var arrowStartY = endY - arrowSize * Math.sin(angle + Math.PI / 6); // Arrowhead startpoint Y

		// Draw the two lines that form the arrowhead
		context.moveTo(endX, endY);
		context.lineTo(arrowEndX, arrowEndY);
		context.moveTo(endX, endY);
		context.lineTo(arrowStartX, arrowStartY);

		// Stroke (draw) the arrow on the canvas
		context.stroke();
	}

	// Function to draw a straight line on a canvas
	function drawLine(context, startX, startY, endX, endY) {
		context.lineCap = "square";
		context.beginPath();
		context.moveTo(startX, startY);
		context.lineTo(endX, endY);
		context.stroke();
	}

	// Function to handle mouse click events for drawing
	/*
	- Sets the starting coordinates.
	- Determines the current mouse position relative to the canvas.
	- Switches between drawing tools (brush, line, rectangle, arrow, crop, text, eraser).
	- Initiates drawing based on the selected tool.
	*/
	function drawClick(e) {
		paint = true;

		// Get the position of the container relative to the document
		var pos = container.el().getBoundingClientRect();

		// Calculate the starting coordinates (startX, startY) based on the mouse click
		startX = e.clientX - pos.left;
		startY = e.clientY - pos.top;

		// Set the current coordinates (currentX, currentY) to the starting coordinates
		currentX = startX;
		currentY = startY;

		// Depending on the selected drawing tool ('tool'), perform specific actions
		switch (tool) {
			case "brush":
				// For the brush tool, begin a new path and move the pen to the starting point
				context_draw.beginPath();
				context_draw.moveTo(startX * scale, startY * scale);
				context_draw.lineTo(currentX * scale, currentY * scale);
				context_draw.stroke();
				break;
			case "line":
				// For the line tool, set up the shape canvas to start drawing a line
				canvas_shape.el().width = video.videoWidth;
				canvas_shape.el().height = video.videoHeight;
				canvas_shape.el().style.left = "0px";
				canvas_shape.el().style.top = "0px";
				canvas_shape.show();
				break;
			case "rect":
				// For the rectangle tool, set up the shape canvas to start drawing a rectangle
				canvas_shape.el().width = 0;
				canvas_shape.el().height = 0;
				canvas_shape.el().style.left = (startX < currentX ? startX : currentX) + "px";
				canvas_shape.el().style.top = (startY < currentY ? startY : currentY) + "px";
				canvas_shape.show();
				break;
			case "arrow":
				// For the arrow tool, set up the shape canvas to start drawing an arrow
				canvas_shape.el().width = video.videoWidth;
				canvas_shape.el().height = video.videoHeight;
				canvas_shape.el().style.left = "0px";
				canvas_shape.el().style.top = "0px";
				canvas_shape.show();
				break;
			case "crop":
				// For the crop tool, show the cropbox and update its position and size
				cropbox.el().style.width = Math.abs(currentX - startX) + "px";
				cropbox.el().style.height = Math.abs(currentY - startY) + "px";
				cropbox.el().style.left = (currentX < startX ? currentX : startX) + "px";
				cropbox.el().style.top = (currentY < startY ? currentY : startY) + "px";
				cropbox.el().style.border = "1px dashed " + colorButton.el().value;
				cropbox.el().style.color = colorButton.el().value;
				cropbox.show();
				break;
			case "text":
				// For the text tool, if the textbox is hidden, set up its initial position and show it
				if (textbox.hasClass("vjs-hidden")) {
					textbox.el().style.width = Math.abs(currentX - startX) + "px";
					textbox.el().style.height = Math.abs(currentY - startY) + "px";
					textbox.el().style.left = (currentX < startX ? currentX : startX) + "px";
					textbox.el().style.top = (currentY < startY ? currentY : startY) + "px";
					textbox.el().style.border = "1px dashed " + colorButton.el().value;
					textbox.el().style.color = colorButton.el().value;
					textbox.el().style.font = (sizeButton.el().value * 2) + "px sans-serif";
					textbox.show();
				}
				break;
			case "eraser":
				// For the eraser tool, clear a square area on the drawing canvas
				var s = sizeButton.el().value;
				context_draw.clearRect(scale * currentX - s / 2, scale * currentY - s / 2, s, s);
				break;
		}
	}

	// Function to handle mouse move events during drawing
	/*
	- Checks if painting is enabled (mouse button is pressed).
	- Retrieves the current mouse position relative to the canvas.
	- Updates ongoing drawing based on the selected tool.
	- Adjusts canvas for drawing shapes or responding to user interactions.
	*/
	function mouseMove(e) {
		if (paint) {
			var pos = container.el().getBoundingClientRect();

			currentX = e.clientX - pos.left;
			currentY = e.clientY - pos.top;

			switch (tool) {
				case "brush":
					// For the brush tool, continue drawing by adding a line segment to the path
					context_draw.lineTo(scale * currentX, scale * currentY);
					context_draw.stroke();
					break;
				case "line":
					// For the line tool, clear the shape canvas and draw the line from the starting point to the current point
					context_shape.clearRect(0, 0, context_shape.canvas.width, context_shape.canvas.height);
					context_shape.strokeStyle = colorButton.el().value;
					context_shape.lineWidth = sizeButton.el().value / 2;
					drawLine(context_shape, startX * scale, startY * scale, currentX * scale, currentY * scale);
					break;
				case "rect":
					// For the rectangle tool, clear the shape canvas and draw a rectangle from the starting point to the current point
					context_shape.clearRect(0, 0, context_shape.canvas.width, context_shape.canvas.height);
					var width = currentX - startX;
					var height = currentY - startY;
					canvas_shape.el().width = Math.abs(width);
					canvas_shape.el().height = Math.abs(height);
					canvas_shape.el().style.left = (width < 0 ? currentX : startX) + "px";
					canvas_shape.el().style.top = (height < 0 ? currentY : startY) + "px";
					context_shape.strokeStyle = colorButton.el().value;
					context_shape.lineWidth = sizeButton.el().value / scale;
					context_shape.strokeRect(0, 0, canvas_shape.el().width, canvas_shape.el().height);
					break;
				case "arrow":
					// For the arrow tool, clear the shape canvas and draw an arrow from the starting point to the current point
					context_shape.clearRect(0, 0, context_shape.canvas.width, context_shape.canvas.height);
					context_shape.strokeStyle = colorButton.el().value;
					context_shape.lineWidth = sizeButton.el().value / 2;
					drawArrow(context_shape, startX * scale, startY * scale, currentX * scale, currentY * scale);
					break;
				case "crop":
					// For the crop tool, update the size and position of the cropbox based on the current point
					cropbox.el().style.width = Math.abs(currentX - startX) + "px";
					cropbox.el().style.height = Math.abs(currentY - startY) + "px";
					cropbox.el().style.left = (currentX < startX ? currentX : startX) + "px";
					cropbox.el().style.top = (currentY < startY ? currentY : startY) + "px";
					break;
				case "text":
					// For the text tool, update the size and position of the textbox based on the current point
					textbox.el().style.width = Math.abs(currentX - startX) + "px";
					textbox.el().style.height = Math.abs(currentY - startY) + "px";
					textbox.el().style.left = (currentX < startX ? currentX : startX) + "px";
					textbox.el().style.top = (currentY < startY ? currentY : startY) + "px";
					break;
				case "eraser":
					// For the eraser tool, clear a square area on the drawing canvas at the current point
					var s = sizeButton.el().value;
					context_draw.clearRect(scale * currentX - s / 2, scale * currentY - s / 2, s, s);
					break;
			}

			// Prevent the default behavior of the mouse move event
			e.preventDefault();
		}
	}

	// Function to handle finishing drawing operations
	function finish() {
		if (paint) {
			paint = false; // Set the 'paint' flag to false to indicate that drawing is finished

			switch (tool) {
				case "rect":
					// For the rectangle tool, draw the rectangle on the drawing canvas and hide the shape canvas
					context_draw.drawImage(
						canvas_shape.el(),
						scale * (startX < currentX ? startX : currentX),
						scale * (startY < currentY ? startY : currentY),
						scale * Math.abs(currentX - startX),
						scale * Math.abs(currentY - startY)
					);
					canvas_shape.hide();
					break;
				case "arrow":
					// For the arrow tool, hide the shape canvas and draw the arrow on the drawing canvas
					canvas_shape.hide();
					drawArrow(
						context_draw,
						startX * scale,
						startY * scale,
						currentX * scale,
						currentY * scale
					);
					break;
				case "line":
					// For the line tool, hide the shape canvas and draw the line on the drawing canvas
					canvas_shape.hide();
					drawLine(
						context_draw,
						startX * scale,
						startY * scale,
						currentX * scale,
						currentY * scale
					);
					break;
				case "text":
					// For the text tool, lose focus on the player, focus on the textbox, and initiate text drawing
					player.el().blur();
					textbox.el().focus();
					break;
			}
		}
	}

	// Function to create the basic structure of the drawing tool and controls
	/*
	The `createBase` function sets up the foundational elements required for the drawing and annotation functionality within the video player:
	- Addition of a camera icon button to the player's control bar, allowing users to take snapshots.
	- Creation of a drawing control bar (`drawCtrl`) that holds the drawing tool buttons.
	- Creation of a parent component (`parent`) to contain various canvas elements and drawing-related controls.
	- Initialization of the drawing control bar as hidden, as well as other related elements.
	*/
	function createBase() {
		// Define a custom button class for different drawing tools
		videojs.ToolButton = videojs.Button.extend({
			init: function (p, options) {
				videojs.Button.call(this, p, options);
				this.addClass("vjs-drawing-" + options.tool);
				this.el().dataset.value = options.tool;
				this.el().title = options.title;
				this.on('click', toolChange); // Attach a click event listener to switch drawing tools
			}
		});

		// Add a camera icon button to the normal player control bar for taking snapshots
		var snap_btn = player.controlBar.addChild('button');
		snap_btn.addClass("vjs-snapshot-button");
		snap_btn.el().title = "Take snapshot";
		snap_btn.on('click', player.snap); // Attach a click event listener to capture a snapshot

		// Create a drawing controls parent container
		parent = player.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl(null, {
					className: 'vjs-canvas-parent'
				}),
			})
		);

		// Create a drawing control bar to switch between different drawing tools
		drawCtrl = player.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl(null, {
					className: 'vjs-control-bar vjs-drawing-ctrl',
				}),
			})
		);
		drawCtrl.hide(); // Hide the drawing control bar initially
	}


	function createColorButton() {
		// Create a color picker input element for selecting the drawing color
		colorButton = drawCtrl.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl('input', {
					className: 'vjs-control', type: 'color', value: '#df4b26', title: 'color'
				}),
			})
		);

		// Attach a change event listener to update the drawing color
		colorButton.on('change', function (e) {
			context_draw.strokeStyle = colorButton.el().value;
			context_shape.strokeStyle = colorButton.el().value;
		});
	}


	function createSizeButton() {
		// Create an input element for selecting the drawing size
		sizeButton = drawCtrl.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl('input', {
					className: 'vjs-control', type: 'number', value: '10', title: 'line width, text size, ...'
				}),
			})
		);

		// Attach a keydown event listener to prevent event propagation
		sizeButton.on('keydown', function (e) {
			e.stopPropagation();
		});

		// Attach a change event listener to update the drawing size
		sizeButton.on('change', function (e) {
			context_draw.lineWidth = sizeButton.el().value / 2;
			context_shape.lineWidth = sizeButton.el().value / 2;
		});
	}


	function createScalerButton() {
		// Create a button element for scaling the image
		var scaler = drawCtrl.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl(null, {
					className: 'vjs-control vjs-drawing-scaler', title: 'scale image'
				})
			})
		);

		// Attach a click event listener to prompt the user for a new width to scale the image
		scaler.on('click', function (e) {
			var w = canvas_draw.el().width, h = canvas_draw.el().height;
			var scalew = window.prompt("Current image size is " + w + "x" + h + " . New width?", w);
			scalew = parseInt(scalew, 10);
			if (!isNaN(scalew)) {
				// Calculate new canvas dimensions and scale the image accordingly
				var factor = scalew / w;
				var width = factor * w | 0;
				var height = factor * h | 0;

				// Scale and replace both the background and drawing canvases
				var r = scaleCropCanvas(0, 0, w, h, width, height, canvas_bg, context_bg);
				canvas_bg = r[0]; context_bg = r[1];
				r = scaleCropCanvas(0, 0, w, h, width, height, canvas_draw, context_draw);
				canvas_draw = r[0]; context_draw = r[1];

				// Update the scale display
				updateScale();
			}
		});
	}


	function createJpegPngButton() {
		// Create buttons for generating JPEG and PNG snapshots
		var dljpeg = drawCtrl.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl(null, {
					className: 'vjs-control vjs-button', innerHTML: 'JPEG', title: 'open new tab with jpeg image'
				}),
			})
		);
		dljpeg.on('click', function () { combineDrawing("image/jpeg"); });

		var dlpng = drawCtrl.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl(null, {
					className: 'vjs-control vjs-button', innerHTML: 'PNG', title: 'open new tab with png image'
				}),
			})
		);
		dlpng.on('click', function () { combineDrawing("image/png"); });
	}

	function createCloseButton() {
		// Create a button to close the drawing tool and return to the video
		var close = drawCtrl.addChild('button');
		close.addClass("vjs-drawing-close");
		close.el().title = "close screenshot and return to video";
		close.on('click', function () {
			// Hide cropbox, canvas elements, and drawing controls
			cropbox.hide();
			parent.hide();
			drawCtrl.hide();

			// Show the player's default control bar and focus on the player
			player.controlBar.show();
			player.el().focus();

			// Enable player controls
			enableDisableControls(false);
		});
	}


	function createScaleText() {
		// Create a text display for showing the current scale factor
		scale_txt = drawCtrl.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl(null, {
					className: 'vjs-scale', innerHTML: '1', title: 'scale factor'
				}),
			})
		);
	}


	function createBackgroundCanvas() {
		// Create a container for the background canvas
		container = parent.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl(null, {
					className: 'vjs-canvas-container' /*TODO*/
				}),
			})
		);

		// Create the background canvas itself
		canvas_bg = container.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl('canvas', {}),
			})
		);
		context_bg = canvas_bg.el().getContext("2d");
	}


	function createDrawCanvas() {
		// Create the drawing canvas
		canvas_draw = container.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl('canvas', {}),
			})
		);
		context_draw = canvas_draw.el().getContext("2d");
	}



	function createShapeCanvas() {
		// Create the shape canvas
		canvas_shape = container.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl('canvas', {}),
			})
		);
		canvas_shape.el().style.zIndex = "1";
		context_shape = canvas_shape.el().getContext("2d");
	}

	function drawCropbox() {
		// Create a cropbox element
		cropbox = container.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl('div', {
					innerHTML: "crop"
				}),
			})
		);
		cropbox.el().style.display = "flex";
		cropbox.on('mousedown', function (e) { cropboxClick(e); });
	}


	function drawTextbox() {
		// Create a textbox element
		textbox = container.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl('textarea', {}),
			})
		);
		textbox.on('keydown', function (e) { e.stopPropagation(); });
		// Draw text when textbox loses focus
		textbox.on('blur', drawText);
	}

}

videojs.plugin('snapshot', snapshot);
