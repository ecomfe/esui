define(function (require) {
    var InputControl = require('esui/InputControl');
    var Validity = require('esui/validator/Validity');
    var ValidityState = require('esui/validator/ValidityState');

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

            it('should return a DOM element', function () {
                var input = new FakeInput();
                input.appendTo(container);
                expect(input.getValidityLabel().nodeType).toBe(1);
            });

            it('should reuse the DOM element', function () {
                var input = new FakeInput();
                input.appendTo(container);
                expect(input.getValidityLabel()).toBe(input.getValidityLabel());
            });

            it('should add validity label to DOM', function () {
                var input = new FakeInput();
                input.appendTo(container);
                var label = input.getValidityLabel();
                var parent = label.parentNode;
                while (parent !== document.documentElement) {
                    parent = parent.parentNode;
                }
                expect(parent).toBe(document.documentElement);
            });
        });

        describe('`showValidity` method', function () {
            it('should exists', function () {
                var input = new FakeInput();
                expect(input.showValidity).toBeOfType('function');
            });

            it('should add general classes to validity label', function () {
                var input = new FakeInput();
                input.appendTo(container);
                input.showValidity(new Validity());
                var label = input.getValidityLabel();
                expect(label.className).toContain('ui-validity');
                expect(label.className).toContain('ui-fake-validity');
            });

            it('should add state classes to validity label', function () {
                var input = new FakeInput();
                input.appendTo(container);
                var validity = new Validity();
                validity.setCustomValidState('test');
                input.showValidity(validity);
                var label = input.getValidityLabel();
                expect(label.className).toContain('ui-validity-test');
                expect(label.className).toContain('ui-fake-validity-test');
            });

            it('should add hidden classes to validity label when control is hidden', function () {
                var input = new FakeInput();
                input.appendTo(container);
                input.hide();
                var validity = new Validity();
                input.showValidity(validity);
                var label = input.getValidityLabel();
                expect(label.className).toContain('ui-hidden');
                expect(label.className).toContain('ui-validity-hidden');
                expect(label.className).toContain('ui-fake-validity-hidden');
            });

            it('should add hidden classes to validity label when control is hidden after validity label is shown', function () {
                var input = new FakeInput();
                input.appendTo(container);
                var validity = new Validity();
                input.showValidity(validity);
                var label = input.getValidityLabel();
                input.hide();
                expect(label.className).toContain('ui-hidden');
                expect(label.className).toContain('ui-validity-hidden');
                expect(label.className).toContain('ui-fake-validity-hidden');
            });

            it('should remove hidden classes from validity label when control is shown', function () {
                var input = new FakeInput();
                input.appendTo(container);
                input.hide();
                var validity = new Validity();
                input.showValidity(validity);
                var label = input.getValidityLabel();
                input.show();
                expect(label.className).not.toContain('ui-hidden');
                expect(label.className).not.toContain('ui-validity-hidden');
                expect(label.className).not.toContain('ui-fake-validity-hidden');
            });
        });
    });
});