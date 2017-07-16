export default angular.module('authenticationModule', [])
    .service('authentication', Service);

function Service(loginResource) {
    'use strict';
    var service = this;

    service.login = login;
    service.fbLogin = fbLogin;
    service.getFbLoginStatus = getFbLoginStatus;

    function login(name, secret) {
        var req = new loginResource();
        req.$get({userName: name, password: secret});
    }

    function fbLogin() {
        getFbLoginStatus();
    }
    
    function getFbLoginStatus() {
        FB.getLoginStatus(loginStatusCallback);
    }

    function loginStatusCallback(response) {
        console.log(response);
    }

    return service;
}