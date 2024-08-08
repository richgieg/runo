var Card = function(value, color) {
    var makeDummyCardValueData = function() {
        var startTag = '<span class="card-content-value-dummy">';
        var endTag = '</span>';
        var value = 'DRAW CARD';
        var element = startTag + value + endTag;
        return element;
    };

    var makeWordCardValueData = function() {
        var valueMap = {
            'DRAW_TWO': ['😝', 'Draw Two', false],
            'WILD_DRAW_FOUR': ['😈', 'Draw Four', true],
            'REVERSE': ['😛', 'Reverse', false],
            'SKIP': ['😂', 'Skip', false],
            'WILD': ['😊', '', true]
        };
        var iconStartTag = '<span class="card-content-value-icon">';
        var iconEndTag = '</span>';
        var iconElement = '';
        var icon = valueMap[value][0];
        if (icon) {
            iconElement = iconStartTag + icon + iconEndTag;
        }
        var wildStartTag = '<span class="card-content-value-wild">';
        var wildEndTag = '</span>';
        var wildElement = '';
        var isWild = valueMap[value][2];
        if (isWild) {
            var wild = 'WILD';
            wildElement = wildStartTag + wild + wildEndTag;
        }
        var wordStartTag = '<span class="card-content-value-word">';
        var wordEndTag = '</span>';
        var wordElement = '';
        var word = valueMap[value][1];
        if (word) {
            wordElement = wordStartTag + word + wordEndTag;
        }
        return iconElement + wildElement + wordElement;
    };

    var makeNumberCardValueData = function() {
        var numStartTag = '<span class="card-content-value-number">';
        var numEndTag = '</span>';
        var numElement = numStartTag + value + numEndTag;
        return numElement;
    };

    var makeCardContent = function() {
        var startTag = '<a class="card-content" href="#">';
        var endTag = '</a>';
        var valueStartTag = '<span class="card-content-value">';
        var valueEndTag = '</span>';
        var valueElement;
        var valueData;
        if (!isNaN(value)) {
            valueData = makeNumberCardValueData();
        } else if (value === 'DUMMY') {
            valueData = makeDummyCardValueData();
        } else {
            valueData = makeWordCardValueData();
        }
        valueElement = valueStartTag + valueData + valueEndTag;
        var content;
        content = $(startTag + valueElement + endTag);

        if (color) {
            content.addClass('card-' + color.toLowerCase());
        }
        return content;
    };

    this.value = value;
    this.color = color;
    this.contentElement = makeCardContent();
    this.contentElement.on('click', function() { return false; });
    this.element = $('<div class="card"></div>');
    this.element.append(this.contentElement);
};

Card.prototype.isActive = function() {
    return this.element.hasClass('card-active');
};

Card.prototype.activate = function() {
    this.element.addClass('card-active');
};

Card.prototype.deactivate = function() {
    this.element.removeClass('card-active');
};

Card.prototype.remove = function() {
    this.element.remove();
};
