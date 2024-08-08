var Flash = function() {
    this.element = $('<div id="flash"></div>');
};

Flash.prototype.update = function(game_data) {
    for (var i = 0; i < game_data.messages.length; i++) {
        this.element.append(new FlashMessage(game_data.messages[i]).element);
    }
};
