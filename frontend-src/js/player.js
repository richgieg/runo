var Player = function(playerJSON) {
    // Initialize player data
    this.id = playerJSON.id;
    this.uxId = playerJSON.ux_id;
    this.points = playerJSON.points;
    this.roundsWon = playerJSON.rounds_won;
    this.numCards = playerJSON.hand_size;
    this.isActive = playerJSON.active;
    this.isAdmin = playerJSON.admin;
    this.isGameWinner = playerJSON.game_winner;
    this.isDrawRequired = playerJSON.draw_required;
    if (this.id) {
        this.name = 'Me';
    } else {
        this.name = playerJSON.name;
    }

    // Create the player element
    this.element = $('<tr class="player"></tr>');
    this.nameElement = $('<td></td>');
    this.nameElement.text(this.name);
    this.pointsElement = $('<td></td>');
    this.roundsWonElement = $('<td></td>');
    this.numCardsElement = $('<td></td>');
    this.element.append(this.nameElement);
    this.element.append(this.pointsElement);
    this.element.append(this.roundsWonElement);
    this.element.append(this.numCardsElement);

    // Highlight the active player
    if (this.isActive) {
        this.activate();
    }
};

Player.prototype.activate = function() {
    var element = this.element;
    setTimeout(function() {
        element.addClass('player-active');
    }, 1500);
};

Player.prototype.deactivate = function() {
    var element = this.element;
    setTimeout(function() {
        element.removeClass('player-active');
    }, 250);
};

Player.prototype.update = function(playerJSON, game_data) {
    this.points = playerJSON.points;
    this.pointsElement.text(this.points)
    this.roundsWon = playerJSON.rounds_won;
    this.roundsWonElement.text(this.roundsWon);
    this.numCards = playerJSON.hand_size;
    this.numCardsElement.text(this.numCards);
    this.isGameWinner = playerJSON.game_winner;
    this.isDrawRequired = playerJSON.draw_required;
    this.isAdmin = playerJSON.admin;

    if (playerJSON.active && !this.isActive) {
        this.activate();
    } else if (!playerJSON.active && this.isActive) {
        this.deactivate();
    }

    if (this.isGameWinner) {
        this.element.addClass('player-winner');
    }

    this.isActive = playerJSON.active;
};
