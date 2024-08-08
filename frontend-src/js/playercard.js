var PlayerCard = function(cardJSON, onSuccess, onFailure) {
    var value = cardJSON.value;
    var color = cardJSON.color;

    InteractiveCard.call(this, value, color, function() {
        // Make JSON call to play the card
        json.playCard(this.id, null, function(data) {
            if (data.result && onSuccess) {
                onSuccess();
            } else if (!data.result && onFailure) {
                onFailure();
            }
        });
    });
    this.id = cardJSON.id;
};
PlayerCard.prototype = Object.create(InteractiveCard.prototype);
PlayerCard.prototype.constructor = PlayerCard;
