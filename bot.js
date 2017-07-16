var socket = require('socket.io-client')('http://localhost:44444');
var euclidean = require('compute-euclidean-distance');

socket.on('connect', connectFnc);
socket.on('disconnect', disconnectFnc);
socket.on('player moved', playerMovedFnc);
socket.on('player killed', playerKilledFnc);
socket.on('game start', start);
socket.on('game over', stop);

var botName = 'bot' + new Date().getTime();

var playing = false;

var players = {};

var speedCoef = 200;

var speedLeft = { 
    type: 25,
    x: -1 * speedCoef,
    y: 0
};

var left = {
    speed: speedLeft,
    rotation: 3.141
};

var speedRight = { 
    type: 25,
    x: 1 * speedCoef,
    y: 0
};

var right = {
    speed: speedRight,
    rotation: 0
};

var bot = {
    name: botName,
    x: 100,
    y: 200,
    rotation: 0,
    velocity: 0,
    angularAcceleration: 0,
    acceleration: 0,
    isBot: true
};

var currentDirection = right;
var currentTarget;
var shotReady = true;
var shots = 10;

function connectFnc() {
    socket.emit('user connected', botName);
    cycle();
    findClosestTarget();

}

function playerMovedFnc(player) {
    if(player.name != bot.name) {
        if(players[player.name]) {
            players[player.name].x = player.x;
            players[player.name].y = player.y;
            players[player.name].rotation = player.rotation;
            players[player.name].velocity = player.velocity;
            players[player.name].acceleration = player.acceleration;
            players[player.name].angularAcceleration = player.angularAcceleration;
            players[player.name].isBot = player.isBot;
        }
        else {
            players[player.name] = player;
        }
        players[player.name].lastAliveTime = new Date().getTime();
    }
}

function disconnectFnc() {

}

function fireShot() {
    var shotInfo = {
        player: bot.name,
        x: bot.x,
        y: bot.y,
        rotation: bot.rotation
    };

    if(shotReady && playing) {
        socket.emit('shot', shotInfo);
        shotReady = false;
        shots -= 1;
    }
    else {
        setTimeout(function() {
            shotReady = true;
        }, 50);
    }
    setTimeout(reload, 2000)
}

function reload() {
    shots += 1;
}

function cycle() {
    if(bot.x > 1920) {
        currentDirection = left;
    }
    else if( bot.x < 0) {
        currentDirection = right;
    }

    if(currentTarget) {
        bot.rotation = getAngleTo(currentTarget);
        var botArray = [ bot.x, bot.y];
        var curArray = [ currentTarget.x, currentTarget.y];
        var distance = euclidean(botArray, curArray);
        if(distance > 100 && playing) {
            bot.acceleration = getAccelerationFromRotation(bot.rotation, 200);
            bot.velocity = bot.acceleration;
        } 
        else {
            bot.acceleration = {x :0, y:0};
            bot.velocity = bot.acceleration;
        }

        if(distance < 1000) {
            if(shots) {
                fireShot();
            }
        }
        
    }
    else {
        bot.velocity = currentDirection.speed;
        bot.rotation = currentDirection.rotation;
    }

    if(playing) {
        bot.x += bot.velocity.x / 20;
        bot.y += bot.velocity.y / 20;
    }

    socket.emit('player moved', bot);
    setTimeout(cycle, 50);
}

function getPlayerList(includeBots) {
    var keys = Object.keys(players);
    var list = [];
    keys.forEach(function(element) {
        var player = players[element];
        if((player.isBot && includeBots) || !player.isBot)  {
            list.push(players[element]);
        }
    });
    return list;
}

function getAngleTo(target) {
    return Math.atan2(target.y - bot.y, target.x - bot.x);
}

function getAccelerationFromRotation(rotation, speed) {
    var point = {
        x: Math.cos(rotation) * speed,
        y: Math.sin(rotation) * speed
    };

    return point;
}

function findClosestTarget() {
    var closest = null;
    var closestDist = 9999999;
    var list = getPlayerList(true);
    var botArray = [ bot.x, bot.y];

    var currentTime = new Date().getTime();

    //remove disconnected
    var disconnected = list.filter(a => (currentTime - a.lastAliveTime) >  1000);
    if(disconnected.length > 0) {
        list.forEach(a => delete players[a.name]);
    }
    //get players only
    list = getPlayerList(false);

    list.forEach(function(element) {
        var curArray = [ element.x, element.y];
        var curDist = euclidean(botArray, curArray);
        if(curDist < closestDist || closest === null) {
            closest = element;
            closestDist = curDist;
        }
        //console.log('Distance from ' + element.name + ': ' + curDist);
    });

    if(closest !== null) {
        //console.log('New target is ', closest.name);
        currentTarget = closest;
    }
    
    setTimeout(findClosestTarget, 1000);
}

function playerKilledFnc(info){
    if(info.player === bot.name) {
        bot.x = Math.round(Math.random() * 1900);
	    bot.y = Math.round(Math.random() * 1000);
    }
}

function start() {
    playing = true;
}

function stop() {
    playing = false;
}

