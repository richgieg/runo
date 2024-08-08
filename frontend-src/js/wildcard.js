var WildCard = function(handElement, cardJSON, onSuccess, onFailure) {
    var value = cardJSON.value;
    this.id = cardJSON.id;
    this.colorSelector = new ColorSelector(this.id, onSuccess, onFailure);
    handElement.prepend(this.colorSelector.element);

    InteractiveCard.call(this, value, null, function() {
        this.colorSelector.show();
    });
};
WildCard.prototype = Object.create(InteractiveCard.prototype);
WildCard.prototype.constructor = WildCard;

WildCard.prototype.remove = function() {
    this.colorSelector.remove();
    InteractiveCard.prototype.remove.call(this);
};
