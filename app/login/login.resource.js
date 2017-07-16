export default angular.module('loginResourceModule', [])
    .factory('loginResource', Factory);

function Factory($resource, appConfig) {
    'use strict';
    var url = appConfig.apiUrl + '/login';
    var actions = {
        login: {method: 'POST'}
    }
    return $resource(url, {}, actions);
}