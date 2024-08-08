var Title = function() {
    var title = 'RUNO';
    this.element = $('<div id="title">' + title + '</div>');
};

Title.prototype.update = function(game_data) {
    var title = 'RUNO -- ' + game_data['name'];
    this.element.text(title);
};
