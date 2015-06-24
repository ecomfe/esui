define(function (require) {
    var Control = require('esui/Control');
    var SafeWrapper = require('esui/SafeWrapper');

    describe('SafeWrapper', function () {
        it('should be a constructor', function () {
            expect(SafeWrapper).toBeOfType('function');
        });

        it('should be instantiable', function () {
            expect(function () { new SafeWrapper(); }).not.toThrow();
        });

        it('should override all methods from `Control`', function () {
            for (var method in SafeWrapper.prototype) {
                if (Control.prototype.hasOwnProperty(method)
                    && typeof Control.prototype[method] === 'function'
                ) {
                    expect(SafeWrapper.prototype[method]).not.toBe(Control.prototype[method], method);
                }
            }
        });
    });
});
