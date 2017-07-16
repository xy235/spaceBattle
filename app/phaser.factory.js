var angular = require('angular');


export default angular.module('phaFactoryModule', [])
.factory('pha', phaserFactory);

function phaserFactory() {
  'use strict';
  return Phaser;  
} 
