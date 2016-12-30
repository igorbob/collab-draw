var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var clients = [];

app.use(express.static('scripts'));
app.set('port', (process.env.PORT || 5000));
app.get('/', function(req, res){
  res.sendFile(__dirname+'/index.html');
});

io.on('connection', function(socket){
  console.log(socket.id + ' entered');
  clients.push(socket);
	socket.on('disconnect', function(){
  	var index = clients.indexOf(socket);
    if (index != -1) {
      clients.splice(index, 1);
      console.info(socket.id + ' left');
    }
	});

  // send img-req to first user
  if (socket.id != clients[0].id) { clients[0].emit('imageRequest'); };
  socket.on('imageReady', function(data) {
    clients[clients.length - 1].emit('image', data);
  });

  // broadcast drawing events:
	socket.on('startPath', function(data) {
		socket.broadcast.emit('startPath', data);
	});
	socket.on('continuePath', function(data) {
		socket.broadcast.emit('continuePath', data);
	});
	socket.on('endPath', function(data) {
		socket.broadcast.emit('endPath', data);
	});

  socket.on('erase', function() {
    io.sockets.emit('erase');
  })
});

http.listen(app.get('port'), function(){
  console.log('Node app is running on port', app.get('port'));
});