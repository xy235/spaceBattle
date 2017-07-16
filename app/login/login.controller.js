var angular = require('angular');

export default angular.module('loginControllerModule', [])
    .controller('loginController', Controller);

function Controller(authentication) {
    'use strict';
    var vm = this;
    vm.name = undefined;
    vm.password = undefined;

    vm.login = authentication.login;
    vm.fbLogin = authentication.fbLogin;

    return vm;
}