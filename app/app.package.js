var angular = require('angular');
var angularResourceModule = require('angular-resource');

import appConfigModule from './app.config.js';
import appRoutesModule from './app.routes.js';

import loginModule from './login/login.package.js';

import gameControllerModule from './game.controller.js';
import socketFactoryModule from './socket.factory.js';
import phaFactoryModule from './phaser.factory.js';
import playerFactoryModule from './player.factory.js';
import gameStateServiceModule from './game-state.service.js';
import gameStatesConstantModule from './game-states.constant.js';




export default angular.module('appModule', [
	angularResourceModule,

	appConfigModule.name,
	appRoutesModule.name,

	loginModule.name,

	gameControllerModule.name,
	socketFactoryModule.name,
	phaFactoryModule.name,
	playerFactoryModule.name,
	gameStateServiceModule.name,
	gameStatesConstantModule.name,
]);