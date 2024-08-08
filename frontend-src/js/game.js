var runGame = function() {
    var update = function(game_data) {
        if (!$.isEmptyObject(game_data)) {
            topBar.update(game_data);
            scoreboard.update(game_data);
            flash.update(game_data);
            tray.update(game_data);
            hand.update(game_data);
        }
    };

    // Disable AJAX caching (fixes issue in IE and Edge)
    json.disableCaching();

    // Create the game element
    var element = $('<div id="game"></div>');

    // Create top bar, with start button handler
    var topBar = new TopBar(function() {
        json.start(function(result) {
            if (result) {
                json.getState(update);
            }
        })
    });
    element.append(topBar.element);

    // Create the scoreboard
    var scoreboard = new Scoreboard();
    element.append(scoreboard.element);

    // Create the flash
    var flash = new Flash();
    element.append(flash.element);

    // Create the tray
    var tray = new Tray(function() {
        json.getState(update);
    }, function() {
        json.getState(update);
    });
    element.append(tray.element);

    // Create the player's hand
    var hand = new Hand(function() {
        json.getState(update);
    }, function() {
        json.getState(update);
    });
    element.append(hand.element);

    // Display the game
    $('body').prepend(element);
    json.getState(update);
    setInterval(function() {
        json.getState(update);
    }, 500);
};
