var DrawCard = function(onSuccess, onFailure) {
    InteractiveCard.call(this, 'DUMMY', null, function() {
        // Make JSON call to draw a card
        json.draw(function(data) {
            if (data.result && onSuccess) {
                onSuccess();
            } else if (!data.result && onFailure) {
                onFailure();
            }
        });
    });
};
DrawCard.prototype = Object.create(InteractiveCard.prototype);
DrawCard.prototype.constructor = DrawCard;
