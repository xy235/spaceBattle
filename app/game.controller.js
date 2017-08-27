var angular = require('angular');

export default angular.module('chatControllerModule', [])
  .controller('GameController', GameController);

function GameController($window, $scope, $http, pha, socket, playerFactory, gameStateService, gameStates) {
  'use strict';

  var vm = this;

  vm.messages = [];
  vm.name = ' ';
  vm.tempName = '';

  
  
  vm.isMobile = mobilecheck();

  vm.gameRunning = false;
  vm.gameOver = true;
  vm.fragLimit = 20;

  var gameRect = getGameRect();
  var gameFunctions = {
    preload: preload,
    create: create,
    update: update
  };
  vm.gameObjects = {};
  vm.sounds = {};
  vm.players = {};
  vm.rooms = [];

  

  vm.game = new pha.Game(gameRect.width, gameRect.height, pha.AUTO, 'gameCanvas', gameFunctions);



  var w = angular.element($window);
  w.bind('resize', function () {
    resizeFunc();
  });

  vm.send = send;
  vm.fieldSend = fieldSend;
  vm.setName = setName;
  vm.fieldSetName = fieldSetName;

  getRooms();

  return vm;

  function getRooms() {
    $http.get('/api/rooms').then(function (response) {
      vm.rooms = response.data;
    });
  }

  function gameStart() {
    vm.gameRunning = true;
    gameStateService.setState(gameStates.STARTING);
    socket.emit('user connected', vm.name);
    vm.game.time.events.add(100, sendCoords, vm); //send own position
    vm.game.time.events.add(1000, checkDisconnected, vm); //kick disconnected players
    initSocket();
  }

  function preload() {
    vm.game.load.image('bg', './img/bg.png');
    vm.game.load.image('spaceBg', './img/spaceBG.jpg');
    vm.game.load.image('hero', './img/hero.png');
    vm.game.load.image('ship', './img/ship.png');
    vm.game.load.image('shot', './img/shot.png');
    vm.game.load.image('healthbar', './img/healthbar.png');

    vm.game.load.audio('laser', './sounds/laser.wav');
    vm.game.load.audio('menuMusic', './sounds/menu.mp3');

    vm.game.stage.backgroundColor = '#FFFFFF';
  }

  function create() {
    //game size
    vm.game.world.setBounds(0, 0, 1920, 1080);

    //if(vm.isMobile) {
      initMobile();
    //}

    //config
    vm.game.time.advancedTiming = true;

    //physics and rendering
    vm.game.stage.disableVisibilityChange = true;
    vm.game.renderer.clearBeforeRender = false;
    vm.game.renderer.roundPixels = true;
    vm.game.physics.startSystem(pha.Physics.ARCADE);

    //vm.gameObjects.bg = vm.game.add.sprite(0, 0, 'bg');
    vm.gameObjects.spaceBg = vm.game.add.sprite(0, 0, 'spaceBg');
    //vm.gameObjects.hero = vm.game.add.sprite(gameRect.width/2, gameRect.height/2, 'hero');


    //sounds
    vm.sounds.laser = vm.game.add.audio('laser');
    vm.sounds.menuMusic = vm.game.add.audio('menuMusic');

    //own player
    vm.shotTime = vm.game.time.now;

    vm.game.input.keyboard.addKeyCapture([
      pha.Keyboard.LEFT,
      pha.Keyboard.RIGHT,
      pha.Keyboard.UP,
      pha.Keyboard.DOWN
    ]);

    //game state
    gameStateService.init(vm.game);
    vm.gameObjects.gameStateText = gameStateService.gameStateText;
  }

  function initMobile() {
    //game scale
    // make the game occuppy all available space, but respecting
    // aspect ratio – with letterboxing if needed
    vm.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    vm.game.scale.pageAlignHorizontally = true;
    vm.game.scale.pageAlignVertically = true;
  }

  function update() {
    if (!vm.gameRunning) return;

    var playerKeys = Object.keys(vm.players);
    var gameRect = getGameRect();

    //ship controls
    var ship = vm.player.ship;

    //move player
    if (vm.game.input.keyboard.isDown(pha.Keyboard.LEFT)) {
      ship.body.angularVelocity = -300;
    } else if (vm.game.input.keyboard.isDown(pha.Keyboard.RIGHT)) {
      ship.body.angularVelocity = 300;
    } else {
      ship.body.angularVelocity = 0;
    }

    if (vm.game.input.keyboard.isDown(pha.Keyboard.UP)) {
      vm.game.physics.arcade.accelerationFromRotation(ship.rotation, 200, ship.body.acceleration);
    } else if (vm.game.input.keyboard.isDown(pha.Keyboard.DOWN)) {
      vm.game.physics.arcade.accelerationFromRotation(ship.rotation, -200, ship.body.acceleration);
    } else {
      ship.body.acceleration.set(0);
    }

    if (vm.game.input.keyboard.isDown(pha.Keyboard.X) && !vm.gameOver) {
      fireShot();
    }

    //move camera
    vm.game.camera.x = Math.ceil(ship.x - gameRect.width / 2);
    vm.game.camera.y = Math.ceil(ship.y - gameRect.height / 2);

    //game state text
    if (gameStateService.gameState.showText) {
      vm.gameObjects.gameStateText.x = Math.ceil(vm.game.camera.x + gameRect.width / 2);
      vm.gameObjects.gameStateText.y = Math.ceil(vm.game.camera.y + gameRect.height / 8);
    }
    else {
      vm.gameObjects.gameStateText.x = -100;
      vm.gameObjects.gameStateText.y = -100;
    }

    //scores	
    playerKeys.forEach(function (playerName, index) {
      var player = vm.players[playerName];
      player.scoreText.setText(player.name + ': ' + player.score);
      if (vm.game.input.keyboard.isDown(pha.Keyboard.S) || vm.gameOver) {
        player.scoreText.x = Math.ceil(vm.game.camera.x + gameRect.width / 2);
        player.scoreText.y = Math.ceil(vm.game.camera.y + gameRect.height / 4 + index * 10);
      }
      else {
        player.scoreText.x = -10;
        player.scoreText.y = -10;
      }
    });


    //move players
    playerKeys.forEach(function (playerName) {
      var player = vm.players[playerName];
      playerFactory.updatePlayerPosition(player);
    });


    //collisions
    playerKeys.forEach(function (player1) {
      playerKeys.forEach(function (player2) {
        var player1obj = vm.players[player1];
        var player2obj = vm.players[player2];
        vm.game.physics.arcade.collide(player1obj.shots, player2obj.ship, shotHit, null, null);
      });
    });

    //fps
    vm.game.debug.text(vm.game.time.fps, 2, 14, "#00ff00");
  }

  function shotHit(ship, shot) {
    shot.kill();
    var player = ship.player;
    var enemy = shot.player;
    playerFactory.takeDamage(player, enemy);
  }

  function fireShot() {
    if (vm.game.time.now > vm.shotTime) {
      var sprite = vm.player.ship;
      var shot = vm.player.shots.getFirstExists(false);
      var shotInfo = {
        player: vm.name,
        x: sprite.body.x,
        y: sprite.body.y,
        rotation: sprite.rotation
      };

      if (shot) {
        shoot(shot, shotInfo);
        vm.shotTime = vm.game.time.now + 50;
        socket.emit('shot', shotInfo);
      }
    }
  }

  function shotFromPlayer(shotInfo) {
    var player = shotInfo.player;
    var shot = vm.players[player].shots.getFirstExists(false);

    if (shot) {
      shoot(shot, shotInfo);
    }
  }

  function shoot(shot, shotInfo) {
    shot.reset(shotInfo.x + 16, shotInfo.y + 16);
    shot.lifespan = 2000;
    shot.rotation = shotInfo.rotation;
    vm.game.physics.arcade.velocityFromRotation(shotInfo.rotation, 800, shot.body.velocity);
    vm.sounds.laser.play();
  }

  function resizeFunc() {
    vm.game.scale.scaleMode = pha.ScaleManager.RESIZE;
    vm.game.scale.refresh();
  }

  function getGameRect() {
    var gameDiv = angular.element(document.getElementById('gameCanvas'))[0];
    var gameDivRect = gameDiv.getBoundingClientRect();
    return {
      width: gameDivRect.width,
      height: gameDivRect.width * 0.75
    };
  }


  function send() {
    socket.emit('chat message', vm.name + ': ' + vm.textMessage);
    vm.textMessage = '';
  }

  function fieldSend() {
    if (event.keyCode === 13) {
      send();
    }
  }

  function setName() {
    vm.name = vm.tempName;
    var player = playerFactory.create(vm.name, vm.game);
    playerFactory.localPlayer = player;
    vm.player = player;
    vm.players[vm.name] = player;
    gameStart();
  }

  function fieldSetName() {
    if (event.keyCode === 13) {
      setName();
    }
  }

  function checkDisconnected() {
    var currentTime = vm.game.time.now;
    var playerKeys = Object.keys(vm.players);
    playerKeys.forEach(function (playerName) {
      if (playerName !== vm.player.name) {
        var player = vm.players[playerName];
        if (currentTime - player.lastAliveTime > 1000) {
          playerFactory.destroyPlayer(vm.players[playerName]);
          delete vm.players[playerName];
          addMessage(playerName + ' has disconnected.');
        }
      }
    });
    vm.game.time.events.add(1000, checkDisconnected, vm);
  }

  function sendCoords() {
    var ship = vm.player.ship;

    var player = {
      name: vm.name,
      x: ship.x,
      y: ship.y,
      rotation: ship.rotation,
      velocity: ship.body.velocity,
      angularAcceleration: ship.body.angularAcceleration,
      acceleration: ship.body.acceleration
    };
    socket.emit('player moved', player);

    vm.game.time.events.add(50, sendCoords, vm);
  }

  function addMessage(msg) {
    vm.messages.push(msg);
    if (vm.messages.length > 10) {
      vm.messages.splice(0, 1);
    }
  }

  function initSocket() {
    socket.on('chat message', function (msg) {
      var date = new Date();
      var dateString = '[' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ']';
      addMessage(dateString + ' ' + msg);
    });

    socket.on('user connected', function (user) {
      if (user === vm.name) { return; }
      addRemotePlayer(user);
      addMessage(user + ' has connected.');
    });

    socket.on('player moved', function (player) {
      if (player.name === vm.name) { return; }
      if (vm.players[player.name] === undefined) {
        addRemotePlayer(player.name);
      }
      vm.players[player.name].ship.x = player.x;
      vm.players[player.name].ship.y = player.y;
      vm.players[player.name].ship.body.velocity = player.velocity;
      vm.players[player.name].ship.rotation = player.rotation;
      vm.players[player.name].ship.body.angularAcceleration = player.angularAcceleration;
      vm.players[player.name].ship.body.acceleration = player.acceleration;
      vm.players[player.name].isBot = player.isBot;
      vm.players[player.name].lastAliveTime = vm.game.time.now;
    });

    socket.on('player killed', function (info) {
      vm.players[info.enemy].score++;
      playerFactory.kill(vm.players[info.player]);
    });

    socket.on('shot', shotFromPlayer);

    socket.on('game over', function () {
      gameStateService.setState(gameStates.OVER);
      vm.gameOver = true;
    });

    socket.on('game restart', function () {
      vm.gameOver = true;
      var playerKeys = Object.keys(vm.players);
      playerKeys.forEach(function (playerName, index) {
        var player = vm.players[playerName];
        player.score = 0;
      });
      gameStateService.setState(gameStates.STARTING);
    });

    socket.on('game start', function () {
      vm.gameOver = false;
      gameStateService.setState(gameStates.RUNNING);
    });
  }

  function addRemotePlayer(user) {
    var newPlayer = playerFactory.create(user, vm.game);
    vm.players[user] = newPlayer;
  }

  function mobilecheck() {
    var check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
  }
}
