var Tray = function(onDrawSuccess, onDrawFailure) {
    // Create the draw card
    this.drawCard = new DrawCard(onDrawSuccess, onDrawFailure);

    // Declare the last discarded card
    this.lastDiscard = null;

    // Create the tray element and append the draw card to it
    this.element = $('<div id="tray" class=""></div>');
    this.element.append(this.drawCard.element);
};

Tray.prototype.update = function(game_data) {
    if (game_data.last_discard) {
        if (!this.lastDiscard) {
            this.lastDiscard = new DiscardCard(game_data.last_discard);
            this.element.prepend(this.lastDiscard.element);
            this.lastDiscard.activate();
        } else if (game_data.last_discard.id !== this.lastDiscard.id) {
            var oldDiscard = this.lastDiscard;
            this.lastDiscard = new DiscardCard(game_data.last_discard);
            this.element.prepend(this.lastDiscard.element);
            var newDiscard = this.lastDiscard;
            setTimeout(function() {
                oldDiscard.deactivate();
            }, 150);
            setTimeout(function() {
                oldDiscard.element.remove();
            }, 750);
            setTimeout(function() {
                newDiscard.activate();
            }, 1000);
        }
    }

    var isCurrentPlayerActive = false;
    for (var i = 0; i < game_data.players.length; i++) {
        if (game_data.players[i].id && game_data.players[i].active) {
            isCurrentPlayerActive = true;
            break;
        }
    }

    if (isCurrentPlayerActive) {
        this.drawCard.activate();
    } else {
        this.drawCard.deactivate();
    }
};
