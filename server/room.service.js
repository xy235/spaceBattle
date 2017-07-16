var roomStates = {
    STARTING: 1,
    RUNNING: 2,
    OVER: 4
};

var roomService = {
    rooms: [],
    roomStates: roomStates,
    createRoom: createRoom,
    removeRoom: removeRoom,
    addPlayerToRoom: addPlayerToRoom,
    resetScoresInRoom: resetScoresInRoom,
    removeSocketFromRoom: removeSocketFromRoom
};


function createRoom(roomName) {
    var room = {
        name: roomName,
        players: [],
        state: roomStates.STARTING
    }
    roomService.rooms.push(room);
}

function removeRoom(roomName) {
    roomService.rooms = roomService.rooms.filter(a => a.name != roomName);
}

function addPlayerToRoom(player, room) {
    if (room.players.find(a => a.player)) {
        return;
    }
    room.players.push(player);
    player.room = room.name;
}

function resetScoresInRoom(room) {
    room.players.forEach(player => player.score = 0);
}

function removeSocketFromRoom(socket, room) {
    var index = room.players.findIndex(a => a.socket === socket);
    if (index > -1) {
        room.players.splice(index, 1);
    }
}

module.exports = roomService;