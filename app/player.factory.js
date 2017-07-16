var angular = require('angular');

export default angular.module('playerFactoryModule', [])
.factory('playerFactory', PlayerFactory);

function PlayerFactory(pha, socket) {
	'use strict';

	var factory = {
		create: create,
		updatePlayerPosition: updatePlayerPosition,
		takeDamage: takeDamage,
		kill: kill,
		destroyPlayer: destroyPlayer,
		localPlayer: undefined
	};

	return factory;

	function create(player, game) {
		//healthbar
		var healthbar = game.add.sprite(0, 0, 'healthbar');
		healthbar.anchor.set(0.5, 0.5);
		healthbar.scale.setTo(0.5, 0.25);

		//name
		var textStyle = { font: '12px Arial', fill: '#FFFFFF',align: 'center'};
		var name = game.add.text(0, -20, player, textStyle);
    	name.anchor.set(0.5, 0.5);
		
		//scoreText
		var scoreText = game.add.text(0, -20, 0, textStyle);
    	scoreText.anchor.set(0.5, 0.5);

    	//ship
		var object = game.add.sprite(0, 0, 'ship');
		object.scale.setTo(0.5, 0.5);
		object.anchor.setTo(0.5, 0.5);

		//ship physics
	    game.physics.enable(object, pha.Physics.ARCADE);
	    object.body.drag.set(100);
	    object.body.maxVelocity.set(200);
	    object.body.collideWorldBounds=true;
	    object.body.immovable = true;

	    //shots
		var shots = game.add.group();
		shots.enableBody = true;
		shots.physicsBodyType = pha.Physics.ARCADE;
		shots.createMultiple(10,'shot');
		shots.setAll('anchor.x', 0.5);
		shots.setAll('anchor.y', 0.5);
		shots.setAll('scale.x', 0.5);
		shots.setAll('scale.y', 0.5);


		var playerObj = {
			name: player,
			text: name,
			healthbar: healthbar,
			ship: object,
			shots: shots,
			lives: 0,
			score: 0,
			scoreText: scoreText,
			lastAliveTime: game.time.now
		};

		object.player = playerObj;
		shots.children.forEach(function(shot) {
			shot.player = playerObj;
		});

		resetLives(playerObj);
		spawnOnRandomPosition(playerObj);
		
		return playerObj;
	}

	function updatePlayerPosition(player) {
		player.text.y = Math.ceil(player.ship.y - 20);
	    player.text.x = Math.ceil(player.ship.x);

	    player.healthbar.y = Math.ceil(player.ship.y - 20);
	    player.healthbar.x = Math.ceil(player.ship.x);
	}

	function takeDamage(player, enemy) {
		setLivesOfPlayer(player.lives-1, player);
		var info = {};
	    if(player === factory.localPlayer && player.lives <= 0) {
	      spawnOnRandomPosition(player);
	      resetLives(player);
		  info = {
			  player: player.name,
			  enemy: enemy.name
		  };
		  socket.emit('player killed', info);
	    }
	    else if(enemy === factory.localPlayer && player.isBot && player.lives <= 0) {
			info = {
				player: player.name,
				enemy: enemy.name
			};
			socket.emit('player killed', info);
		}
	}
	
	function kill(player) {
		resetLives(player);
	}
	
	function resetLives(player) {
		setLivesOfPlayer(10, player);
	}
	
	function setLivesOfPlayer(lives, player) {
		player.lives = lives;
		player.healthbar.scale.x = player.lives/5 * 0.5;
	}
	
	function spawnOnRandomPosition(player) {
		player.ship.x = Math.round(Math.random() * 1900);
	    player.ship.y = Math.round(Math.random() * 1000);
	}
	
	function destroyPlayer(player) {
		player.ship.destroy();
		player.healthbar.destroy();
		player.text.destroy();
		player.scoreText.destroy();
		player.shots.destroy();
	}
}