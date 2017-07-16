import loginControllerModule from './login.controller.js';
import loginResourceModule from './login.resource.js';
import authenticationServiceModule from './authentication.service.js';

export default angular.module('loginModule', [
    loginControllerModule.name,
    loginResourceModule.name,
    authenticationServiceModule.name
]);