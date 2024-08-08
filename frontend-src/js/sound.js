var sound = (function() {
    var obj = {};

    obj.pop = function() {
        (new Audio(STATIC_PATH + 'pop.wav')).play();
    };

    obj.swing = function() {
        (new Audio(STATIC_PATH + 'swing.wav')).play();
    };

    return obj;
})();
