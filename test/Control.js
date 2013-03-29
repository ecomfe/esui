define(function (require) {
    var Control = require('esui/Control');
    var esui = require('esui');

    describe('Control', function () {
        var control = new Control();

        it('should be instantiatable', function () {
            expect(control).toBeDefined();
        });

        var methods = ['createMain', 'render', 'appendTo', 'insertBefore',
            'get', 'set', 'setProperties', 'setViewContext', 'disable',
            'enable', 'isDisabled', 'show', 'hide', 'isHidden', 'addState',
            'removeState', 'toggleState', 'hasState', 'addChild', 'removeChild',
            'getChild', 'initChildren', 'dispose'];
        describe('should have a method named', function () {
            for (var i = 0; i < methods.length; i++) {
                (function (i) {
                    it(methods[i], function () {
                        expect(control[methods[i]]).toBeOfType('function');
                    });
                }(i));
            }
        });

        describe('event model', function () {
            it('should have a `on` method', function () {
                var control = new Control();
                expect(control.on).toBeOfType('function');
            });

            it('should have a `un` method', function () {
                var control = new Control();
                expect(control.un).toBeOfType('function');
            });
            
            it('should have a `fire` method', function () {
                var control = new Control();
                expect(control.fire).toBeOfType('function');
            });
            
            it('should be able to add an event handler', function () {
                var control = new Control();
                expect(function () { control.on('name', function () {}) }).not.toThrow();
            });

            describe('when event is fired', function () {
                var control;
                var handler;
                var backupHandler;
                var queue = [];
                beforeEach(function () {
                    control = new Control();
                    handler = jasmine.createSpy();
                    backupHandler = jasmine.createSpy();
                    control.on('name', handler);
                    control.on('*', backupHandler);
                    control.fire('name', { x: 1 });
                });

                it('should call added handler when event is fired', function () {
                    expect(handler).toHaveBeenCalled();
                });

                it('should pass a `type` property in event args', function () {
                    expect(handler.mostRecentCall.args[0].type).toBe('name');
                });

                it('should pass extra properties in event args', function () {
                    expect(handler.mostRecentCall.args[0].x).toBe(1);
                });

                it('should call handler added via `*` event when any event is fired', function () {
                    expect(backupHandler).toHaveBeenCalled();
                });

                it('should give the original `type` property in handler added via `*` event', function () {
                    expect(backupHandler.mostRecentCall.args[0].type).toBe('name');
                });
            
                it('should be able to remove an event handler', function () {
                    var control = new Control();
                    expect(function() { control.un('name', function () {}) }).not.toThrow();
                });

                it('should call handlers by order', function () {
                    var queue = [];
                    var control = new Control();
                    control.on('name', function () { queue.push('a'); });
                    control.on('name', function () { queue.push('b'); });
                    control.on('name', function () { queue.push('c'); });
                    control.fire('name');
                    expect(queue.join('')).toBe('abc');
                });

                it('should call handlers added via `*` event after those added via named event', function () {
                    var queue = [];
                    var control = new Control();
                    control.on('*', function() { queue.push('b'); });
                    control.on('name', function() { queue.push('a'); });
                    control.fire('name');
                    expect(queue.join('')).toBe('ab');
                });

                it('should not call removed event handlers', function () {
                    var control = new Control();
                    var handler = jasmine.createSpy();
                    control.on('name', handler);
                    control.un('name', handler);
                    control.fire('name');
                    expect(handler).not.toHaveBeenCalled();
                });

                it('should remove all event handlers when only the event name is passed to `un` method', function () {
                    var control = new Control();
                    var handler = jasmine.createSpy();
                    control.on('name', handler);
                    control.un('name');
                    control.fire('name');
                    expect(handler).not.toHaveBeenCalled();
                });
            });
        });
    });
});