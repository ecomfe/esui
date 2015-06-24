define(function (require) {
    var Validity = require('esui/validator/Validity');
    var ValidityState =require('esui/validator/ValidityState');

    describe('Validity', function () {
        it('should be a constructor', function () {
            expect(Validity).toBeOfType('function');
        });

        it('should be instantiable', function () {
            expect(new Validity()).toBeOfType('object');
        });

        describe('`addStaet`, `getState` & `getStates` methods', function () {
            it('should exists', function () {
                var validity = new Validity();
                expect(validity.addState).toBeOfType('function');
                expect(validity.getState).toBeOfType('function');
                expect(validity.getStates).toBeOfType('function');
            });

            it('should be able to add a named `ValidityState` object', function () {
                var validity = new Validity();
                var state = new ValidityState(true, '');
                expect(function () { validity.addState('test', state); }).not.toThrow();
            });

            it('should be able to get added `ValidityState` object', function () {
                var validity = new Validity();
                var state = new ValidityState(true, '');
                validity.addState('test', state);
                expect(validity.getStates().length).toBe(1);
                expect(validity.getStates()[0]).toBe(state);
                expect(validity.getState('test')).toBe(state);
            });

            it('should return null when getting a non-exist state', function () {
                var validity = new Validity();
                expect(validity.getState('test')).toBe(null);
            });

            it('should return an empty array when calling `getStates` method with no state added', function () {
                var validity = new Validity();
                expect(validity.getStates()).toEqual([]);
            });

            it('should return a different array each time `getStates` is called', function () {
                var validity = new Validity();
                expect(validity.getStates()).not.toBe(validity.getStates());
            });
        });

        describe('`setCustomMessage` & `getCustomMessage` methods', function () {
            it('should exist', function () {
                var validity = new Validity();
                expect(validity.setCustomMessage).toBeOfType('function');
                expect(validity.getCustomMessage).toBeOfType('function');
            });

            it('should get an empty string is no custom message is provided', function () {
                var validity = new Validity();
                expect(validity.getCustomMessage()).toBe('');
            });

            it('should be able get setted custom message', function () {
                var validity = new Validity();
                validity.setCustomMessage('test');
                expect(validity.getCustomMessage()).toBe('test');
            });
        });

        describe('`isValid` method', function () {
            it('should exists', function () {
                var validity = new Validity();
                expect(validity.isValid).toBeOfType('function');
            });

            it('should return true if no state is added', function () {
                var validity = new Validity();
                expect(validity.isValid()).toBe(true);
            });

            it('should return true when all states are valid', function () {
                var validity = new Validity();
                validity.addState('a', new ValidityState(true, ''));
                validity.addState('b', new ValidityState(true, ''));
                expect(validity.isValid()).toBe(true);
            });

            it('should return false when one state is invalid', function () {
                var validity = new Validity();
                validity.addState('a', new ValidityState(true, ''));
                validity.addState('b', new ValidityState(false, ''));
                expect(validity.isValid()).toBe(false);
            });
        });

        describe('`setCustomValidState` & `getValidState` methods', function () {
            it('should exist', function () {
                var validity = new Validity();
                expect(validity.setCustomValidState).toBeOfType('function');
                expect(validity.getValidState).toBeOfType('function');
            });

            it('should return custom valid state if provided', function () {
                var validity = new Validity();
                validity.setCustomValidState('test');
                expect(validity.getValidState()).toBe('test');
            });

            it('should return "valid" if no custom state is provided when it is valid', function () {
                var validity = new Validity();
                expect(validity.getValidState()).toBe('valid');
            });

            it('should return "valid" if no custom state is provided when it is invalid', function () {
                var validity = new Validity();
                validity.addState('test', new ValidityState(false, ''));
                expect(validity.getValidState()).toBe('invalid');
            });
        });
    });
})