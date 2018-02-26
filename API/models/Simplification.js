module.exports = class Simplification {
    constructor(value, rule) {
        this._value = value;
        this._rule = rule;
    }

    get value(){
        return this._value;
    }

    set value(value) {
        this._value = value;
    }

    get rule(){
        return this._rule;
    }

    toJSON() {
        return {
            step: this.value,
            rule: this.rule
        }
    }
}