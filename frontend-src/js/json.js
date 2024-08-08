var json = (function() {
    var obj = {}
    var lastGetState = null;

    obj.disableCaching = function() {
        $.ajaxSetup({cache: false});
    };

    obj.getState = function(callback) {
        var currentTime = new Date();
        if ((currentTime - lastGetState) > 50) {
            $.getJSON($SCRIPT_ROOT + '/getstate', {
                game_id: GAME_ID,
                player_id: PLAYER_ID
            }, callback);
            lastGetState = currentTime;
        }
    };

    obj.start = function(callback) {
        $.getJSON($SCRIPT_ROOT + '/start', {
            game_id: GAME_ID,
            player_id: PLAYER_ID
        }, callback);
    };

    obj.playCard = function(cardId, selectedColor, callback) {
        $.getJSON($SCRIPT_ROOT + '/playcard', {
            game_id: GAME_ID,
            player_id: PLAYER_ID,
            card_id: cardId,
            selected_color: selectedColor
        }, callback);
    };

    obj.draw = function(callback) {
        $.getJSON($SCRIPT_ROOT + '/draw', {
            game_id: GAME_ID,
            player_id: PLAYER_ID
        }, callback);
    };

    return obj;
})();
