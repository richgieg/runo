var ColorSelector = function(cardId, onSuccess, onFailure) {
    this.element = $('<div class="color-selector"></div>');
    this.element.append(new ColorSelectorButton(cardId, 'red', onSuccess, onFailure).element);
    this.element.append(new ColorSelectorButton(cardId, 'blue', onSuccess, onFailure).element);
    this.element.append(new ColorSelectorButton(cardId, 'green', onSuccess, onFailure).element);
    this.element.append(new ColorSelectorButton(cardId, 'yellow', onSuccess, onFailure).element);
};

ColorSelector.prototype.remove = function() {
    this.element.remove();
};

ColorSelector.prototype.show = function() {
    if (!this.element.hasClass('color-selector-active')) {
        this.element.addClass('color-selector-active');
        var element = this.element;
        setTimeout(function() {
            element.removeClass('color-selector-active');
        }, 3000);
    }
};
