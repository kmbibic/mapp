module.exports = class Simplification {
    constructor(step, rule) {
        this._step = step;
        this._rule = rule;
    }

    get step(){
        return this._step;
    }

    set step(step) {
        this._step = step;
    }

    get rule(){
        return this._rule;
    }

    toJSON() {
        return {
            step: this.step,
            rule: this.rule
        }
    }
}