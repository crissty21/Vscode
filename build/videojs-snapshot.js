function snapshot(options) {
	var player = this;
	var video = player.el().querySelector('video');
	var container, scale;


	function updateScale() {
		var rect = video.getBoundingClientRect();
		var scalew = canvas_draw.el().width / rect.width;
		var scaleh = canvas_draw.el().height / rect.height;
		scale = Math.max(Math.max(scalew, scaleh), 1);
		scale_txt.el().innerHTML = (Math.round(1 / scale * 100) / 100) + "x";
	}

	player.snap = function () {
		player.pause();
		player.el().blur();
		player.controlBar.hide();
		drawCtrl.show();
		parent.show();

		// canvas for drawing, it's separate from snapshot because of delete
		canvas_draw.el().width = video.videoWidth;
		canvas_draw.el().height = video.videoHeight;
		context_draw.strokeStyle = color.el().value;
		context_draw.lineWidth = size.el().value / 2;
		context_draw.lineCap = "round";
		// calculate scale
		updateScale();

		// background canvas containing snapshot from video
		canvas_bg.el().width = video.videoWidth;
		canvas_bg.el().height = video.videoHeight;
		context_bg.drawImage(video, 0, 0);

		// still fit into player element
		var rect = video.getBoundingClientRect(); // use bounding rect instead of player.width/height because of fullscreen
		canvas_draw.el().style.maxWidth = rect.width + "px";
		canvas_draw.el().style.maxHeight = rect.height + "px";
		canvas_bg.el().style.maxWidth = rect.width + "px";
		canvas_bg.el().style.maxHeight = rect.height + "px";
	};

	// camera icon on normal player control bar
	var snap_btn = player.controlBar.addChild('button');
	snap_btn.addClass("vjs-snapshot-button");
	snap_btn.el().title = "Take snapshot";
	snap_btn.on('click', player.snap);

	// drawing controls
	// add canvas parent container before draw control bar, so bar gets on top
	var parent = player.addChild(
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl(null, {
				className: 'vjs-canvas-parent' /*TODO*/
			}),
		})
	);

	//draw control bar
	var drawCtrl = player.addChild(
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl(null, {
				className: 'vjs-control-bar vjs-drawing-ctrl',
			}),
		})
	);
	drawCtrl.hide();

	// choose color, used everywhere: painting, border color of cropbox, ...
	var color = drawCtrl.addChild(
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl('input', {
				className: 'vjs-control', type: 'color', value: '#df4b26', title: 'color'
			}),
		})
	);
	color.on('change', function (e) {
		context_draw.strokeStyle = color.el().value;
	});

	// choose size, used everywhere: line width, text size
	var size = drawCtrl.addChild(
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl('input', {
				className: 'vjs-control', type: 'number', value: '10', title: 'line width, text size, ...'
			}),
		})
	);
	size.on('keydown', function (e) { // don't fire player shortcuts when size input has focus
		e.stopPropagation();
	});
	size.on('change', function (e) {
		context_draw.lineWidth = size.el().value / 2;
	});

	var tool = 'brush';
	function toolChange(event) {
		var active_tool = drawCtrl.el().querySelector('.vjs-tool-active');
		active_tool.classList.remove('vjs-tool-active');
		event.target.classList.add('vjs-tool-active');
		tool = event.target.dataset.value;
		// always hide cropbox, textbox is hidden automatically as it blurs
		cropbox.hide();
	}
	videojs.ToolButton = videojs.Button.extend({
		init: function (p, options) {
			videojs.Button.call(this, p, options);

			this.addClass("vjs-drawing-" + options.tool);
			this.el().dataset.value = options.tool;
			this.el().title = options.title;

			this.on('click', toolChange);
		}
	});
	var brush = drawCtrl.addChild(new videojs.ToolButton(player, { tool: "brush", title: "freehand drawing" }));
	brush.addClass("vjs-tool-active");
	var rect = drawCtrl.addChild(new videojs.ToolButton(player, { tool: "rect", title: "draw rectangle" }));
	var arrow = drawCtrl.addChild(new videojs.ToolButton(player, { tool: "arrow", title: "draw arrow" }));
	var crop = drawCtrl.addChild(new videojs.ToolButton(player, { tool: "crop", title: "select area and click selection to crop" }));
	var text = drawCtrl.addChild(new videojs.ToolButton(player, { tool: "text", title: "select area, type message and then click somewhere else" }));
	var eraser = drawCtrl.addChild(new videojs.ToolButton(player, { tool: "eraser", title: "erase drawing in clicked location" }));

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
		// just ignore
	});

	function combineDrawing(encoding) {
		//blit canvas and open new tab with image
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

	// close button leading back to normal video play back
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

	// scale display
	var scale_txt = drawCtrl.addChild(
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl(null, {
				className: 'vjs-scale', innerHTML: '1', title: 'scale factor'
			}),
		})
	);

	// canvas stuff
	container = parent.addChild(
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl(null, {
				className: 'vjs-canvas-container' /*TODO*/
			}),
		})
	);
	var canvas_bg = container.addChild(
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl('canvas', {
			}),
		})
	);
	var context_bg = canvas_bg.el().getContext("2d");

	var canvas_draw = container.addChild(
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl('canvas', {
			}),
		})
	);
	var context_draw = canvas_draw.el().getContext("2d");

	var canvas_rect = container.addChild(
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl('canvas', {
			}),
		})
	);
	canvas_rect.el().style.zIndex = "1"; // always on top of other canvas elements
	var context_rect = canvas_rect.el().getContext("2d");

	var canvas_arrow = container.addChild(
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl('canvas', {
			}),
		})
	);
	var context_arrow = canvas_arrow.el().getContext("2d");


	var cropbox = container.addChild(
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl('div', {
				innerHTML: "crop"
			}),
		})
	);
	cropbox.el().style.display = "flex";
	// crop handling, create new canvas and replace old one
	function scaleCropCanvas(left, top, width, height, newwidth, newheight, canvas, context) {
		// 		var newcanvas = document.createElement('canvas');
		var newcanvas = new videojs.Component(player, { // FIXME: that's quite silly
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
	cropbox.on('mousedown', function (e) {
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
		e.stopPropagation(); //otherwise canvas below gets mousedown
	});

	var textbox = container.addChild(
		new videojs.Component(player, {
			el: videojs.Component.prototype.createEl('textarea', {
			}),
		})
	);
	textbox.on('keydown', function (e) { // don't fire player shortcuts when textbox has focus
		e.stopPropagation();
	});
	// draw text when textbox looses focus
	textbox.on('blur', function (e) {
		context_draw.fillStyle = color.el().value;
		context_draw.font = (scale * size.el().value * 2) + "px sans-serif";
		context_draw.textBaseline = "top";
		context_draw.fillText(textbox.el().value,
			scale * textbox.el().offsetLeft + scale,
			scale * textbox.el().offsetTop + scale);
		textbox.hide();
		textbox.el().value = "";
	});

	parent.hide();
	canvas_rect.hide();
	canvas_arrow.hide();
	cropbox.hide();
	textbox.hide();

	// Function to draw an arrow from (startX, startY) to (endX, endY)
	function drawArrow(context, startX, startY, endX, endY) {
		context.beginPath();
		context.moveTo(startX, startY);
		context.lineTo(endX, endY);

		// Arrowhead properties
		var arrowSize = 10;
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

	var paint = false;
	var startX, startY, currentX, currentY;

	container.on('mousedown', function (e) {
		paint = true;
		var pos = container.el().getBoundingClientRect();
		startX = e.clientX - pos.left;
		startY = e.clientY - pos.top;
		currentX = startX;
		currentY = startY;

		switch (tool) {
			case "brush":
				context_draw.beginPath();
				context_draw.moveTo(startX, startY);
				context_draw.lineTo(currentX, currentY);
				context_draw.stroke();
				break;
			case "rect":
				// rectangle is scaled when blitting, not when dragging
				canvas_rect.el().width = 0;
				canvas_rect.el().height = 0;
				canvas_rect.el().style.left = (startX < currentX ? startX : currentX) + "px";
				canvas_rect.el().style.top = (startY < currentY ? startY : currentY) + "px";
				canvas_rect.show();
				break;
			case "arrow":
				canvas_arrow.el().width = canvas_bg.el().width;
				canvas_arrow.el().height = canvas_bg.el().height;
				canvas_arrow.show();
				drawArrow(context_arrow, startX, startY, currentX, currentY);
				break;
			case "crop":
				cropbox.el().style.width = Math.abs(currentX - startX) + "px"; // resize
				cropbox.el().style.height = Math.abs(currentY - startY) + "px";
				cropbox.el().style.left = (currentX < startX ? currentX : startX) + "px";
				cropbox.el().style.top = (currentY < startY ? currentY : startY) + "px";

				cropbox.el().style.border = "1px dashed " + color.el().value;
				cropbox.el().style.color = color.el().value;
				cropbox.show();
				break;
			case "text":
				// if shown already, lose focus and draw it first, otherwise, it gets drawn at mousedown
				if (textbox.hasClass("vjs-hidden")) {
					textbox.el().style.width = Math.abs(currentX - startX) + "px"; // resize
					textbox.el().style.height = Math.abs(currentY - startY) + "px";
					textbox.el().style.left = (currentX < startX ? currentX : startX) + "px";
					textbox.el().style.top = (currentY < startY ? currentY : startY) + "px";

					textbox.el().style.border = "1px dashed " + color.el().value;
					textbox.el().style.color = color.el().value;
					textbox.el().style.font = (size.el().value * 2) + "px sans-serif";
					textbox.show();
				}
				break;
			case "eraser":
				var s = size.el().value;
				context_draw.clearRect(scale * currentX - s / 2, scale * currentY - s / 2, s, s);
				break;
		}
	});

	container.on('mousemove', function (e) {
		if (paint) {
			var pos = container.el().getBoundingClientRect();
			currentX = e.clientX - pos.left;
			currentY = e.clientY - pos.top;

			switch (tool) {
				case "brush":
					context_draw.lineTo(scale * currentX, scale * currentY);
					context_draw.stroke();
					break;
				case "rect":
					context_rect.clearRect(0, 0, context_rect.canvas.width, context_rect.canvas.height);
					var width = currentX - startX;
					var height = currentY - startY;
					canvas_rect.el().width = Math.abs(width);
					canvas_rect.el().height = Math.abs(height);
					canvas_rect.el().style.left = (width < 0 ? currentX : startX) + "px";
					canvas_rect.el().style.top = (height < 0 ? currentY : startY) + "px";
					context_rect.strokeStyle = color.el().value;
					context_rect.lineWidth = size.el().value / scale;
					context_rect.strokeRect(0, 0, canvas_rect.el().width, canvas_rect.el().height);
					break;
				case "arrow":
					context_arrow.clearRect(0, 0, context_arrow.canvas.width, context_arrow.canvas.height);
					context_arrow.strokeStyle = color.el().value;
					context_arrow.lineWidth = size.el().value / scale / 2;
					drawArrow(context_arrow, startX, startY, currentX, currentY);
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
					var s = size.el().value;
					context_draw.clearRect(scale * currentX - s / 2, scale * currentY - s / 2, s, s);
					break;
			}
			e.preventDefault();
		}
	});

	function finish() {
		if (paint) {
			paint = false;
			if (tool == "rect") {
				//blit canvas_rect on canvas, scaled
				context_draw.drawImage(canvas_rect.el(),
					scale * (startX < currentX ? startX : currentX), scale * (startY < currentY ? startY : currentY),
					scale * Math.abs(currentX - startX), scale * Math.abs(currentY - startY));
				canvas_rect.hide();
			}
			else if(tool == "arrow")
			{
				drawArrow(context_draw, startX, startY, currentX, currentY);
				canvas_arrow.hide();
			}
			else if (tool == "text") {
				player.el().blur();
				textbox.el().focus();
			}
		}
	}

	container.on('mouseup', finish);
	container.on('mouseleave', finish);

}

videojs.plugin('snapshot', snapshot);
