var Controls = function(startHandler) {
    // Create the controls element
    this.element = $('<div id="controls"></div>');

    // Create the start button
    this.startButtonOn = false;
    this.startButton = $('<a class="game-control">Start</a>');
    this.startButton.attr('href', '#');
    this.startButton.attr('id', 'start-button');
    if (startHandler) {
        this.startButton.on('click', startHandler);
    }

    // Create the quit button
    this.quitButton = $('<a class="game-control">Quit</a>');
    this.quitButton.attr('href', QUIT_URL);
    this.quitButton.attr('id', 'quit-button');
    this.element.append(this.quitButton);
};

Controls.prototype.update = function(game_data) {

    // Get data for the current player
    var isAdmin;
    for (var i = 0; i < game_data.players.length; i++) {
        if (game_data.players[i].id) {
            isAdmin = game_data.players[i].admin;
        }
    }

    // Determine if the start button should be displayed
    if (!this.startButtonOn) {
        if (isAdmin) {
            if (!game_data.started_at) {
                this.element.prepend(this.startButton);
                this.startButtonOn = true;
            }
        }
    } else {
        if (isAdmin) {
            if (game_data.started_at) {
                this.startButton.remove();
                this.startButtonOn = false;
            }
        }
    }
};
