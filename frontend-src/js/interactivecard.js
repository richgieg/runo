var InteractiveCard = function(value, color, handler) {
    Card.call(this, value, color);
    var that = this;
    this.contentElement.on('click', function(e) {
        if (handler && that.isActive()) {
            handler.call(that, e);
        }
        return false;
    });
};
InteractiveCard.prototype = Object.create(Card.prototype);
InteractiveCard.prototype.constructor = InteractiveCard;

InteractiveCard.prototype.activate = function(active) {
    this.contentElement.addClass('card-content-clickable');
    Card.prototype.activate.call(this);
};

InteractiveCard.prototype.deactivate = function(active) {
    this.contentElement.removeClass('card-content-clickable');
    Card.prototype.deactivate.call(this);
};
