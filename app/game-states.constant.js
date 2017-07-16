export default angular.module('GameStatesConstants', [])
    .constant('gameStates', {
        STARTING: {
            text: 'GAME STARTING',
            showText: true,
            music: 'menuMusic',
        },
        RUNNING: {
            text: 'GAME RUNNING',
            showText: false
        },
        OVER: {
            text: 'GAME OVER',
            showText: true,
            music: 'menuMusic'
        }
    });