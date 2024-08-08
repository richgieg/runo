var TopBar = function(startHandler) {
    // Create the top bar element
    this.element = $('<div id="topbar"></div>');
    this.title = new Title();
    this.controls = new Controls(startHandler);
    this.element.append(this.title.element);
    this.element.append(this.controls.element);
};

TopBar.prototype.update = function(game_data) {
    this.title.update(game_data);
    this.controls.update(game_data);
};
