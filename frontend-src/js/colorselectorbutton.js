var ColorSelectorButton = function(cardId, color, onSuccess, onFailure) {
    this.id = cardId;
    this.color = color.toUpperCase();
    this.element = $('<a class="color-selector-button" href="#">');
    var colorClass = 'card-' + this.color.toLowerCase();
    this.element.addClass(colorClass);
    var that = this;
    this.element.on('click', function() {
        json.playCard(that.id, that.color, function(data) {
            if (data.result && onSuccess) {
                onSuccess();
            } else if (!data.result && onFailure) {
                onFailure();
            }
        });
        return false;
    });
};
