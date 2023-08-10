function snapshot() {
	var player = this;
	var video = player.el().querySelector('video');
	var container, scale;
	var tool = 'brush';
	var drawCtrl, parent;
	var colorButton, sizeButton;
	var scale_txt;
	var canvas_bg, context_bg;
	var canvas_draw, context_draw;
	var canvas_shape, context_shape;
	var cropbox, textbox;
	var paint = false;
	var startX, startY, currentX, currentY;

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

	function snap() {
		player.pause();
		player.el().blur();
		player.controlBar.hide();
		drawCtrl.show();
		parent.show();

		// this canvas will hold all the drawings
		// using the drawing tool you will draw directly on this
		canvas_draw.el().width = video.videoWidth;
		canvas_draw.el().height = video.videoHeight;
		context_draw.strokeStyle = colorButton.el().value;
		context_draw.lineWidth = sizeButton.el().value / 2;
		context_draw.lineCap = "round";

		//this canvas is used for drawing shapes
		//it is separeted from canvas_draw because it will be erased at every frame
		canvas_shape.el().width = video.videoWidth;
		canvas_shape.el().height = video.videoHeight;
		context_shape.strokeStyle = colorButton.el().value;
		context_shape.lineWidth = sizeButton.el().value / 2;
		context_shape.lineCap = "square";
		// calculate scale
		updateScale();

		// background canvas containing snapshot from video
		canvas_bg.el().width = video.videoWidth;
		canvas_bg.el().height = video.videoHeight;
		context_bg.drawImage(video, 0, 0);


		// still fit into player element
		var rect = video.getBoundingClientRect();
		canvas_draw.el().style.maxWidth = rect.width + "px";
		canvas_draw.el().style.maxHeight = rect.height + "px";
		canvas_bg.el().style.maxWidth = rect.width + "px";
		canvas_bg.el().style.maxHeight = rect.height + "px";
		canvas_shape.el().style.maxWidth = rect.width + "px";
		canvas_shape.el().style.maxHeight = rect.height + "px";
	}

	function updateScale() {
		var rect = video.getBoundingClientRect();
		var scalew = canvas_draw.el().width / rect.width;
		var scaleh = canvas_draw.el().height / rect.height;
		scale = Math.max(Math.max(scalew, scaleh), 1);
		scale_txt.el().innerHTML = (Math.round(1 / scale * 100) / 100) + "x";
	}

	function createToolsButtons() {
		var brush = drawCtrl.addChild(new videojs.ToolButton(player, { tool: "brush", title: "freehand drawing" }));
		drawCtrl.addChild(new videojs.ToolButton(player, { tool: "line", title: "draw line" }));
		drawCtrl.addChild(new videojs.ToolButton(player, { tool: "rect", title: "draw rectangle" }));
		drawCtrl.addChild(new videojs.ToolButton(player, { tool: "arrow", title: "draw arrow" }));
		drawCtrl.addChild(new videojs.ToolButton(player, { tool: "crop", title: "select area and click selection to crop" }));
		drawCtrl.addChild(new videojs.ToolButton(player, { tool: "text", title: "select area, type message and then click somewhere else" }));
		drawCtrl.addChild(new videojs.ToolButton(player, { tool: "eraser", title: "erase drawing in clicked location" }));
		brush.addClass("vjs-tool-active");
	}

	function toolChange(event) {
		var active_tool = drawCtrl.el().querySelector('.vjs-tool-active');
		active_tool.classList.remove('vjs-tool-active');
		event.target.classList.add('vjs-tool-active');
		tool = event.target.dataset.value;
		cropbox.hide();
	}

	function combineDrawing(encoding) {
		//this will take the background and the drawing canvas and merge them
		//the result will be sent to a new tab
		var canvas_tmp = document.createElement('canvas');
		canvas_tmp.width = canvas_draw.el().width;
		canvas_tmp.height = canvas_draw.el().height;
		var ctx_tmp = canvas_tmp.getContext("2d");
		ctx_tmp.drawImage(canvas_bg.el(), 0, 0);
		ctx_tmp.drawImage(canvas_draw.el(), 0, 0);
		// open a new window with the encoded image
		var imgWindow = window.open("");
		imgWindow.document.write('<html><head><title>snapshot - ' + encoding + '</title></head><body><p>Right-click and save image.</p><img src="' + canvas_tmp.toDataURL(encoding) + '" /></body></html>');
	}

	function scaleCropCanvas(left, top, width, height, newwidth, newheight, canvas, context) {
		// crop handling, create new canvas and replace old one
		var newcanvas = new videojs.Component(player, {
			el: videojs.Component.prototype.createEl('canvas', {
			}),
		});
		var rect = player.el().getBoundingClientRect();
		newcanvas.el().style.maxWidth = rect.width + "px";
		newcanvas.el().style.maxHeight = rect.height + "px";

		newcanvas.el().width = newwidth;
		newcanvas.el().height = newheight;

		var ctx = newcanvas.el().getContext("2d");
		ctx.drawImage(canvas.el(),
			left, top, width, height,
			0, 0, newwidth, newheight
		);
		container.removeChild(canvas);
		container.addChild(newcanvas);

		ctx.lineCap = context.lineCap;
		ctx.strokeStyle = context.strokeStyle;
		ctx.lineWidth = context.lineWidth;
		return [newcanvas, ctx];
	}

	function cropboxClick(e) {
		var left = scale * cropbox.el().offsetLeft | 0;
		var top = scale * cropbox.el().offsetTop | 0;
		var width = scale * cropbox.el().offsetWidth | 0;
		var height = scale * cropbox.el().offsetHeight | 0;
		var r = scaleCropCanvas(left, top, width, height, width, height, canvas_bg, context_bg);
		canvas_bg = r[0]; context_bg = r[1];
		r = scaleCropCanvas(left, top, width, height, width, height, canvas_draw, context_draw);
		canvas_draw = r[0]; context_draw = r[1];
		updateScale();

		cropbox.hide();
		e.stopPropagation();
	}

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

	function drawArrow(context, startX, startY, endX, endY) {
		// Function to draw an arrow from (startX, startY) to (endX, endY)
		context.lineCap = "square";
		context.beginPath();
		context.moveTo(startX, startY);
		context.lineTo(endX, endY);

		// Arrowhead properties
		var arrowSize = sizeButton.el().value / scale * 4;
		var angle = Math.atan2(endY - startY, endX - startX);
		var arrowEndX = endX - arrowSize * Math.cos(angle - Math.PI / 6);
		var arrowEndY = endY - arrowSize * Math.sin(angle - Math.PI / 6);
		var arrowStartX = endX - arrowSize * Math.cos(angle + Math.PI / 6);
		var arrowStartY = endY - arrowSize * Math.sin(angle + Math.PI / 6);

		// Draw arrowhead
		context.moveTo(endX, endY);
		context.lineTo(arrowEndX, arrowEndY);
		context.moveTo(endX, endY);
		context.lineTo(arrowStartX, arrowStartY);
		context.stroke();
	}

	function drawLine(context, startX, startY, endX, endY) {
		context.lineCap = "square";
		context.beginPath();
		context.moveTo(startX, startY);
		context.lineTo(endX, endY);
		context.stroke();
	}

	function drawClick(e) {
		paint = true;
		var pos = container.el().getBoundingClientRect();
		startX = e.clientX - pos.left;
		startY = e.clientY - pos.top;
		currentX = startX;
		currentY = startY;

		switch (tool) {
			case "brush":
				context_draw.beginPath();
				context_draw.moveTo(startX * scale, startY * scale);
				context_draw.lineTo(currentX * scale, currentY * scale);
				context_draw.stroke();
				break;
			case "line":
				canvas_shape.el().width = video.videoWidth;
				canvas_shape.el().height = video.videoHeight;
				canvas_shape.el().style.left = "0px";
				canvas_shape.el().style.top = "0px";
				canvas_shape.show();
				break;
			case "rect":
				canvas_shape.el().width = 0;
				canvas_shape.el().height = 0;
				canvas_shape.el().style.left = (startX < currentX ? startX : currentX) + "px";
				canvas_shape.el().style.top = (startY < currentY ? startY : currentY) + "px";
				canvas_shape.show();
				break;
			case "arrow":
				canvas_shape.el().width = video.videoWidth;
				canvas_shape.el().height = video.videoHeight;
				canvas_shape.el().style.left = "0px";
				canvas_shape.el().style.top = "0px";
				canvas_shape.show();
				break;
			case "crop":
				cropbox.el().style.width = Math.abs(currentX - startX) + "px"; // resize
				cropbox.el().style.height = Math.abs(currentY - startY) + "px";
				cropbox.el().style.left = (currentX < startX ? currentX : startX) + "px";
				cropbox.el().style.top = (currentY < startY ? currentY : startY) + "px";

				cropbox.el().style.border = "1px dashed " + colorButton.el().value;
				cropbox.el().style.color = colorButton.el().value;
				cropbox.show();
				break;
			case "text":
				// if shown already, lose focus and draw it first, otherwise, it gets drawn at mousedown
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
				var s = sizeButton.el().value;
				context_draw.clearRect(scale * currentX - s / 2, scale * currentY - s / 2, s, s);
				break;
		}
	}
	function mouseMove(e) {
		if (paint) {
			var pos = container.el().getBoundingClientRect();
			currentX = e.clientX - pos.left;
			currentY = e.clientY - pos.top;

			switch (tool) {
				case "brush":
					context_draw.lineTo(scale * currentX, scale * currentY);
					context_draw.stroke();
					break;
				case "line":
					context_shape.clearRect(0, 0, context_shape.canvas.width, context_shape.canvas.height);
					context_shape.strokeStyle = colorButton.el().value;
					context_shape.lineWidth = sizeButton.el().value / 2;
					drawLine(context_shape, startX * scale, startY * scale, currentX * scale, currentY * scale);
					break;
				case "rect":
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
					context_shape.clearRect(0, 0, context_shape.canvas.width, context_shape.canvas.height);
					context_shape.strokeStyle = colorButton.el().value;
					context_shape.lineWidth = sizeButton.el().value / 2;
					drawArrow(context_shape, startX * scale, startY * scale, currentX * scale, currentY * scale);
					break;
				case "crop":
					cropbox.el().style.width = Math.abs(currentX - startX) + "px"; // resize
					cropbox.el().style.height = Math.abs(currentY - startY) + "px";
					cropbox.el().style.left = (currentX < startX ? currentX : startX) + "px";
					cropbox.el().style.top = (currentY < startY ? currentY : startY) + "px";
					break;
				case "text":
					textbox.el().style.width = Math.abs(currentX - startX) + "px"; // resize
					textbox.el().style.height = Math.abs(currentY - startY) + "px";
					textbox.el().style.left = (currentX < startX ? currentX : startX) + "px";
					textbox.el().style.top = (currentY < startY ? currentY : startY) + "px";
					break;
				case "eraser":
					var s = sizeButton.el().value;
					context_draw.clearRect(scale * currentX - s / 2, scale * currentY - s / 2, s, s);
					break;
			}
			e.preventDefault();
		}
	}



	function finish() {
		if (paint) {
			paint = false;
			switch (tool) {
				case "rect":
					context_draw.drawImage(canvas_shape.el(),
						scale * (startX < currentX ? startX : currentX), scale * (startY < currentY ? startY : currentY),
						scale * Math.abs(currentX - startX), scale * Math.abs(currentY - startY));
					canvas_shape.hide();
					break;
				case "arrow":
					canvas_shape.hide();
					drawArrow(context_draw, startX * scale, startY * scale, currentX * scale, currentY * scale);
					break;
				case "line":
					canvas_shape.hide();
					drawLine(context_draw, startX * scale, startY * scale, currentX * scale, currentY * scale);
					break;
				case "text":
					player.el().blur();
					textbox.el().focus();
					break;
			}
		}
	}

	function createBase() {
		videojs.ToolButton = videojs.Button.extend({
			init: function (p, options) {
				videojs.Button.call(this, p, options);
				this.addClass("vjs-drawing-" + options.tool);
				this.el().dataset.value = options.tool;
				this.el().title = options.title;
				this.on('click', toolChange);
			}
		});

		// camera icon on normal player control bar
		var snap_btn = player.controlBar.addChild('button');
		snap_btn.addClass("vjs-snapshot-button");
		snap_btn.el().title = "Take snapshot";
		snap_btn.on('click', player.snap);

		// drawing controls
		parent = player.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl(null, {
					className: 'vjs-canvas-parent'
				}),
			})
		);

		//draw control bar
		drawCtrl = player.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl(null, {
					className: 'vjs-control-bar vjs-drawing-ctrl',
				}),
			})
		);
		drawCtrl.hide();
	}


	function createColorButton() {
		// choose color, used everywhere: painting, border color of cropbox
		colorButton = drawCtrl.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl('input', {
					className: 'vjs-control', type: 'color', value: '#df4b26', title: 'color'
				}),
			})
		);
		colorButton.on('change', function (e) {
			context_draw.strokeStyle = colorButton.el().value;
			context_shape.strokeStyle = colorButton.el().value;
		});
	}

	function createSizeButton() {
		// choose size, used everywhere: line width, text size
		sizeButton = drawCtrl.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl('input', {
					className: 'vjs-control', type: 'number', value: '10', title: 'line width, text size, ...'
				}),
			})
		);
		sizeButton.on('keydown', function (e) {
			e.stopPropagation();
		});
		sizeButton.on('change', function (e) {
			context_draw.lineWidth = sizeButton.el().value / 2;
			context_shape.lineWidth = sizeButton.el().value / 2;
		});
	}

	function createScalerButton() {
		var scaler = drawCtrl.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl(null, {
					className: 'vjs-control vjs-drawing-scaler', title: 'scale image'
				})
			})
		);
		scaler.on('click', function (e) {
			var w = canvas_draw.el().width, h = canvas_draw.el().height;
			var scalew = window.prompt("Current image size is " + w + "x" + h + " . New width?", w);
			scalew = parseInt(scalew, 10);
			if (!isNaN(scalew)) {
				var factor = scalew / w;
				var width = factor * w | 0;
				var height = factor * h | 0;

				var r = scaleCropCanvas(0, 0, w, h, width, height, canvas_bg, context_bg);
				canvas_bg = r[0]; context_bg = r[1];
				r = scaleCropCanvas(0, 0, w, h, width, height, canvas_draw, context_draw);
				canvas_draw = r[0]; context_draw = r[1];
				updateScale();
			}
		});
	}

	function createJpegPngButton() {
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
		var close = drawCtrl.addChild('button');
		close.addClass("vjs-drawing-close");
		close.el().title = "close screenshot and return to video";
		close.on('click', function () {
			// hide cropbox
			cropbox.hide();
			// hide all canvas stuff
			parent.hide();
			// switch back to normal player controls
			drawCtrl.hide();
			player.controlBar.show();
			player.el().focus();
		});
	}

	function createScaleText() {
		// scale display
		scale_txt = drawCtrl.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl(null, {
					className: 'vjs-scale', innerHTML: '1', title: 'scale factor'
				}),
			})
		);
	}

	function createBackgroundCanvas() {
		container = parent.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl(null, {
					className: 'vjs-canvas-container' /*TODO*/
				}),
			})
		);
		canvas_bg = container.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl('canvas', {}),
			})
		);
		context_bg = canvas_bg.el().getContext("2d");
	}

	function createDrawCanvas() {
		canvas_draw = container.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl('canvas', {}),
			})
		);
		context_draw = canvas_draw.el().getContext("2d");
	}



	function createShapeCanvas() {
		canvas_shape = container.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl('canvas', {}),
			})
		);
		canvas_shape.el().style.zIndex = "1";
		context_shape = canvas_shape.el().getContext("2d");
	}

	function drawCropbox() {
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
		textbox = container.addChild(
			new videojs.Component(player, {
				el: videojs.Component.prototype.createEl('textarea', {}),
			})
		);
		textbox.on('keydown', function (e) { e.stopPropagation(); });
		// draw text when textbox looses focus
		textbox.on('blur', drawText);

	}
}

videojs.plugin('snapshot', snapshot);
