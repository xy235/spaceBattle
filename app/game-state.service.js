export default angular.module('gameStateServiceModule', [])
    .service('gameStateService', GameStateService);

function GameStateService(gameStates) {
    'use strict';
    var service = this;

    service.game = undefined;
    service.gameStateText = undefined;
    service.gameState = undefined;

    service.init = init;
    service.setState = setState;


    function init(game) {
        service.game = game;
        var textStyle = { font: '50px Arial', fill: '#FFFFFF',align: 'center'};
		service.gameStateText = game.add.text(0, -20, gameStates.STARTING.text, textStyle);
        service.gameStateText.anchor.set(0.5, 0.5);
    }

    function setState(state) {
        if(service.gameState === state) return; //do nothing if switching to same state

        updateMusic(service.gameState, state);

        service.gameState = state;
        service.gameStateText.setText(state.text);
    }

    function updateMusic(oldState, newState) {
        var sound;
        if(oldState && newState && oldState.music === newState.music) {
            return; //do nothing if music is the same
        }
        if(oldState && oldState.music) {{
            sound = service.game.sound._sounds.find(a => a.key === oldState.music);
            if(sound) {
                sound.loop = false;
                sound.stop();
            }
        }}
        if(newState && newState.music) {{
            sound = service.game.sound._sounds.find(a => a.key === newState.music);
            if(sound) {
                sound.loop = true;
                sound.play();
            }
        }}
    }
    


    return service;
}

