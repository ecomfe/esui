define(function (require) {
    var InputControl = require('esui/InputControl');
    var Validity = require('esui/validator/Validity');
    var ValidityState = require('esui/validator/ValidityState');
    var ValidityLabel = require('esui/Validity');
    var helper = require('esui/controlHelper');

    function FakeInput() {
        InputControl.apply(this, arguments);
    }

    FakeInput.prototype.type = 'Fake';

    require('esui/lib').inherits(FakeInput, InputControl);

    describe('InputControl', function () {
        it('should be a constructor', function () {
            expect(InputControl).toBeOfType('function');
        });

        describe('`getValidityLabel` method', function () {
            it('should exists', function () {
                var input = new FakeInput();
                expect(input.getValidityLabel).toBeOfType('function');
            });

            it('should return a `Validity` control', function () {
                var input = new FakeInput();
                input.appendTo(container);
                expect(input.getValidityLabel() instanceof ValidityLabel).toBe(true);
            });

            it('should reuse the same control', function () {
                var input = new FakeInput();
                input.appendTo(container);
                expect(input.getValidityLabel()).toBe(input.getValidityLabel());
            });

            it('should render the label', function () {
                var input = new FakeInput();
                input.appendTo(container);
                var label = input.getValidityLabel();
                expect(helper.isInStage(label, 'RENDERED')).toBe(true);
            });
        });
    });
});