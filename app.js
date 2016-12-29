var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var clients = [];

app.use(express.static('scripts'));
app.get('/', function(req, res){
  res.sendFile(__dirname+'/index.html');
});

io.on('connection', function(socket){
  console.log("socket is ", socket.id);
  clients.push(socket);
	socket.on('disconnect', function(){
  	var index = clients.indexOf(socket);
    if (index != -1) {
      clients.splice(index, 1);
      console.info('Client gone (id=' + socket.id + ').');
    }
	});

  if (socket.id != clients[0].id) {
    //send img-req to first user
    clients[0].emit('imageRequest');
  }
  socket.on('imageReady', function(data) {
    clients[clients.length - 1].emit('image', data);
  } )

	socket.on('startPath', function(data) {
		socket.broadcast.emit('startPath', data);
	});
	socket.on('continuePath', function(data) {
		socket.broadcast.emit('continuePath', data);
	});
	socket.on('endPath', function(data) {
		socket.broadcast.emit('endPath', data);
	});
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});