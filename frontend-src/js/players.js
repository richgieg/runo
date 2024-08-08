var Players = function() {
    // Create the players element
    this.element = $('<tbody id="players"></tbody>');

    // Create the array to hold Player objects
    this.players = [];
};

Players.prototype.indexOf = function(uxId) {
    for (var i = 0; i < this.players.length; i++) {
        if (uxId == this.players[i].uxId) {
            return i;
        }
    }
    return -1;
};

Players.prototype.removePlayer = function(player) {
    var index = this.indexOf(player.uxId);
    if (index !== -1) {
        player.element.remove();
        this.players.splice(index, 1);
    }
};

Players.prototype.removePlayers = function(game_data) {
    var remove = [];
    var playerExists;
    for (var i = 0; i < this.players.length; i++) {
        playerExists = false;
        for (var j = 0; j < game_data.players.length; j++) {
            if (this.players[i].uxId == game_data.players[j].ux_id) {
                playerExists = true;
                break;
            }
        }
        if (!playerExists) {
            remove.push(this.players[i]);
        }
    }
    for (var i = 0; i < remove.length; i++) {
        this.removePlayer(remove[i]);
    }
};

Players.prototype.addPlayers = function(game_data) {
    var newPlayer;
    var playerExists;
    for (var i = 0; i < game_data.players.length; i++) {
        playerExists = false;
        for (var j = 0; j < this.players.length; j++) {
            if (game_data.players[i].ux_id == this.players[j].uxId) {
                playerExists = true;
                break;
            }
        }
        if (!playerExists) {
            newPlayer = new Player(game_data.players[i]);
            this.players.push(newPlayer);
            this.element.append(newPlayer.element);
        }
    }
};

Players.prototype.update = function(game_data) {
    this.removePlayers(game_data);
    this.addPlayers(game_data);

    // Update player objects
    var index;
    for (var i = 0; i < game_data.players.length; i++) {
        index = this.indexOf(game_data.players[i].ux_id);
        this.players[index].update(game_data.players[i], game_data);
    }
};
