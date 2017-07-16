import angular from 'angular';

export default angular.module('appConfigModule', [])
    .factory('appConfig', Factory);

function Factory() {
    'use strict';
    var config = {
        apiUrl: '/api'
    };
    return config;
}