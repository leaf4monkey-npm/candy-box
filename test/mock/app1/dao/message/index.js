/**
 * Created by leaf4monkey on 11/19/2017
 */
const {assert} = require('chai');

module.exports = function (ctx) {
    assert.notEqual(ctx.initialized, true);
    Object.keys(ctx).forEach(key => {
        if (/[iI]nitialized/.test(key)) {
            return;
        }
        assert.isEmpty(ctx[key]);
    });
    ctx.onInitialized(function () {
        assert.equal(ctx.initialized, true);
        Object.keys(ctx).forEach(key => {
            if (/[iI]nitialized/.test(key)) {
                return;
            }
            assert.isNotEmpty(ctx[key]);
        });
    });
    return {
        fn () {
            return ctx;
        }
    };
};
