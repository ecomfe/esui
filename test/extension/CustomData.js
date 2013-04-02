define(function (require) {
    var CustomData = require('esui/extension/CustomData');

    describe('CustomData extension', function () {
        it('should be a constructor', function () {
            expect(CustomData).toBeOfType('function');
        });

        var control = {
            data: 'x: 1; y: 2;',
            dataZ: '3'
        };
        var customData = new CustomData();
        customData.attachTo(control);

        it('should add an `getData` method on control', function () {
            expect(control.getData).toBeOfType('function');
        });

        it('should add an `setData` method on control', function () {
            expect(control.setData).toBeOfType('function');
        });

        it('should parse `data` property on control', function () {
            expect(control.getData('x')).toBe('1');
            expect(control.getData('y')).toBe('2');
        });

        it('should use `data` property directly if it is already an object', function () {
            var control = {
                data: {
                    x: 1,
                    y: 2
                }
            };
            var customData = new CustomData();
            customData.attachTo(control);
            expect(control.getData('x')).toBe(1);
            expect(control.getData('y')).toBe(2);
        });

        it('should include `data*` property as its stored data', function () {
            expect(control.getData('z')).toBe('3');
        });

        it('should return undefined when try to get an non-exist data', function () {
            expect(control.getData('a')).toBeUndefined();
        });

        it('should be ok if control has no `data` property', function () {
            var control = {};
            var customData = new CustomData();
            expect(function () { customData.attachTo(control); }).not.toThrow();
        });

        it('should be able to set a data', function () {
            var control = {};
            var customData = new CustomData();
            customData.attachTo(control);
            expect(function () { control.setData('x', 1); }).not.toThrow();
        });

        it('should store the exact value when set a data', function () {
            var control = {};
            var customData = new CustomData();
            customData.attachTo(control);
            var value = {};
            control.setData('x', value);
            expect(control.getData('x')).toBe(value);
        });

        it('should remove `getData` method when inactivated', function () {
            var control = {};
            var customData = new CustomData();
            customData.attachTo(control);
            customData.inactivate();
            expect(control.getData).toBeUndefined();
        });

        it('should remove `setData` method when inactivated', function () {
            var control = {};
            var customData = new CustomData();
            customData.attachTo(control);
            customData.inactivate();
            expect(control.setData).toBeUndefined();
        });
    });
});