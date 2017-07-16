import angular from 'angular';
import appModule from './app.package.js';

angular.element(document).ready(function() {
  'use strict';
  angular.bootstrap(document.querySelector('html'), [appModule.name], {strictDi: false});
});
  