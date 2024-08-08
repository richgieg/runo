var Scoreboard = function() {
    // Create the scoreboard element
    this.element = $('<table id="scoreboard" class="table table-condensed"></table>');
    this.element.append('<thead><tr><th>Name</th><th>Points</th><th>Rounds</th><th>Cards</th></tr></thead>');

    // Create the players object
    this.players = new Players();
    this.element.append(this.players.element);
};

Scoreboard.prototype.update = function(game_data) {
    this.players.update(game_data);
};
