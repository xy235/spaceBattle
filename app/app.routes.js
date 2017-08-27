import angular from 'angular';
import 'angular-route';

export default angular.module('appRoutesModule', ['ngRoute'])
    .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    'use strict';
    $routeProvider
    .when('/game', {
        templateUrl: 'game.html'
      })
    .when('/login', {
      templateUrl: 'login/login.template.html'
    })
      .otherwise({
        redirectTo: '/'
      });
    $locationProvider.html5Mode(false);
  }]);