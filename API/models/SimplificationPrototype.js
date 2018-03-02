var Simplification = require('../models/Simplification');

module.exports = function SimplificationPrototype(prototype) {
    this.prototype = prototype;

    this.clone = function() {
        var simplification = new Simplification(prototype.step, prototype.rule);

        return simplification;
    }
}