var roomService = require("./server/room.service.js");
var dbService = require("./server/db.service.js");

var express = require('express');
var http = require('http');

var app = express();

var port = 44444;

var server = app.listen(port);
var io = require('socket.io').listen(server);

var fragLimit = 20;

//express
app.use(express.static('./build'));

app.get('/', function (req, res) {
  res.sendFile('index.html', { root: __dirname });
});

app.get('/api/rooms', function (req, res) {
  res.json(roomService.rooms);
});

app.post('/api/login', function (req, res) {
  console.log(req);
  var body = {};
  var authenticated = dbService.login(body.userName, body.password);
  res.json()
});

//socket
io.on('connection', function (socket) {
  socket.on('chat message', function (msg) {
    console.log(msg);
    io.emit('chat message', msg);
  });

  socket.on('user connected', function (user) {
    console.log('user connected: ' + user);
    io.emit('user connected', user);
    var currentRoom = roomService.rooms[0];
    roomService.addPlayerToRoom({ name: user, score: 0, socket: socket.id }, currentRoom);
    if (currentRoom.players.length > 1 && currentRoom.state !== roomService.roomStates.RUNNING) {
      restartGame(currentRoom);
    }
  });

  socket.on('player moved', function (player) {
    io.emit('player moved', player);
  });

  socket.on('player killed', function (info) {
    io.emit('player killed', info);
    var currentRoom = roomService.rooms[0]
    var serverPlayer = currentRoom.players.find(a => a.name === info.enemy);
    if (serverPlayer) {
      serverPlayer.score += 1;
      if (serverPlayer.score === fragLimit) {
        endGame(currentRoom);
        restartGame(currentRoom);
      }
    }

  });

  socket.on('shot', function (shotInfo) {
    socket.broadcast.emit('shot', shotInfo);
  });

  socket.on('disconnect', function () {
    var room = roomService.rooms[0];
    roomService.removeSocketFromRoom(socket.id, room);
    if (room.players.length < 2) {
      endGame(room);
    }
  });
});

function endGame(room) {
  room.state = roomService.roomStates.OVER;
  io.emit('game over');
}

function restartGame(room) {
  setTimeout(function () {
    io.emit('game restart');
    roomService.resetScoresInRoom(room)
    room.state = roomService.roomStates.STARTING;
    setTimeout(function () {
      startGame(room);
    }, 5000);
  }, 10000);
}

function startGame(room) {
  room.state = roomService.roomStates.RUNNING;
  io.emit('game start');
}

//start
console.log('listening on *:' + port);
roomService.createRoom('Room');
dbService.init();

//console commands
var stdin = process.openStdin();

stdin.addListener("data", function (d) {
  var command = d.toString().trim();
  if (command.startsWith('send')) {
    var message = command.substring(5, command.length);
    io.emit(message);
    console.log('sent to all: ' + message);
  }
  if (command.startsWith('fraglimit')) {
    var limit = +command.substring(10, command.length);
    fraglimit = limit;
  }
});