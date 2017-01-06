var socket = io();
paper.install(window);
window.onload = function() {
	paper.setup('drawCanvas');
	var tool = new Tool();
	var paths = {};

	var mask = new Path.Rectangle(view.bounds);
	var bg = new Path.Rectangle(view.bounds);
	bg.fillColor = "#787b7a";
	project.activeLayer.clipped = true;
	view.draw();
	
	socket.on('imageRequest', function() {
		var img = project.activeLayer.rasterize().toDataURL();
		socket.emit('imageReady', {image: img});
	})
	socket.on('image', function(data) {
		raster = new Raster(data.image);
		raster.position = view.center;
	})
	
    project.currentStyle.strokeCap = 'round';
    project.currentStyle.strokeWidth = 3; // thin:2, outlined:3, thick:6
    currentColor = '#000000';

	var colorChooser = document.getElementById('colorButtons');
	var toolChooser = document.getElementById('toolButtons');
	var clearButton = document.getElementById('clear')
	var saveButton = document.getElementById('save');
	colorChooser.addEventListener('click', changeColor);
	toolChooser.addEventListener('click', changeTool);
	clearButton.addEventListener('click', clearImage);
	saveButton.addEventListener('click', saveImage);
	
	function changeColor(event) {
		console.log('change color to:', event.target.id);
		currentColor = event.target.id;
	}

	function changeTool(event) {
		switch(event.target.id) {
			case 'thin':
				project.currentStyle.strokeWidth = 2;
				break;
			case 'thick':
				project.currentStyle.strokeWidth = 6;
				break;
			case 'outline':
				project.currentStyle.strokeWidth = 3;  // 3 == outlined
				break;
			default:
				console.log('defaulted in tool-switch');
		}
	}

	function clearImage(event){
		socket.emit('clear');
	}

	function saveImage(event) {
		var raster = project.activeLayer.rasterize()
		var img = raster.getSubRaster(view.bounds).toDataURL();
		$.ajax({
		    type: "POST",
		    url: "https://mirapaxi.000webhostapp.com/upload.php",
		    data: {image: img}
		}).done(function( respond ) {
		    console.log(respond);
		});
	}
	
	// curved-line tool
	tool.onMouseDown = function(event) {
		var width = project.currentStyle.strokeWidth;
		startPath(event.point, currentColor, width, socket.id);
		socket.emit('startPath', {
			point: event.point, 
			color: currentColor, 
			width: width,
			ID: socket.id
		});
	}
	tool.onMouseDrag = function(event) {
		continuePath(event.point, socket.id);
		socket.emit('continuePath', {point: event.point, ID: socket.id});
	}
	tool.onMouseUp = function(event) {
		endPath(event.point, socket.id);
		socket.emit('endPath', {point: event.point, ID: socket.id});
	}

	function startPath(point, color, width, ID) {
		if (width == 3) {  // add outline
			paths[ID+'o'] = new Path();
			paths[ID+'o'].strokeColor = 'black';
			if (color == '#000000') {
				paths[ID+'o'].strokeColor = '#a6aaa2';
			}
			paths[ID+'o'].strokeWidth = 5;
			paths[ID+'o'].add(point);
		}
		paths[ID] = new Path();
		paths[ID].strokeColor = color;
		paths[ID].strokeWidth = width;
		paths[ID].add(point);
	}
	function continuePath(point, ID) {
		if (paths[ID].strokeWidth == 3) {
			paths[ID+'o'].add(point);
		}
		paths[ID].add(point);
	}
	function endPath(point, ID) {
		if (paths[ID].strokeWidth == 3) {
			paths[ID+'o'].add(point);
			delete paths[ID+'o'];
		}
		paths[ID].add(point);
		delete paths[ID];
	}

	socket.on('startPath', function(data) {
		point = new Point(data.point[1],data.point[2]);
		startPath(point, data.color, data.width, data.ID);
	})
	socket.on('continuePath', function(data) {
		point = new Point(data.point[1],data.point[2]);
		continuePath(point, data.ID);
		view.draw();
	})
	socket.on('endPath', function(data) {
		point = new Point(data.point[1],data.point[2]);
		endPath(point, data.ID);
		view.draw();
	})
	socket.on('clear', function() {
		var bg = new Path.Rectangle(view.bounds);
		bg.fillColor = "#787b7a";
	})
}