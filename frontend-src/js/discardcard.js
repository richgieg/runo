var DiscardCard = function(cardJSON) {
    var value = cardJSON.value;
    var color = cardJSON.color;
    var id = cardJSON.id;
    Card.call(this, value, color);
    this.id = id;
};
DiscardCard.prototype = Object.create(Card.prototype);
DiscardCard.prototype.constructor = DiscardCard;
