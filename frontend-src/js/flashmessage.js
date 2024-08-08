var FlashMessage = function(message) {
    this.element = $('<div class="alert">' + message.data + '</div>');
    this.element.addClass('alert-' + message.type)
    var element = this.element;
    setTimeout(function() {
        element.addClass('alert-active');
        setTimeout(function() {
            element.removeClass('alert-active');
            setTimeout(function() {
                element.remove();
            }, 750);
        }, 2500);
    }, 50);
};
