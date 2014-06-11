define(function (require) {
    var EventQueue = require('mini-event/EventQueue');

    describe('EventQueue', function () {
        it('should be a constructor', function () {
            expect(EventQueue).toBeOfType('function');
        });

        it('should be instantiable', function () {
            expect(new EventQueue()).toBeOfType('object');
        });

        describe('`add` method', function () {
            it('should exist', function () {
                var queue = new EventQueue();
                expect(queue.add).toBeOfType('function');
            });

            it('should be safe to add a function handler', function () {
                var queue = new EventQueue();
                var handler = function () {};
                expect(function () { queue.add(handler); }).not.toThrow();
            });

            it('should be safe to add a function handler with `options` object', function () {
                var queue = new EventQueue();
                var handler = function () {};
                var options = {
                    thieObject: {},
                    once: true
                };
                expect(function () { queue.add(handler, options); }).not.toThrow();
            });

            it('should be safe to add `false` as handler', function () {
                var queue = new EventQueue();
                expect(function () { queue.add(false); }).not.toThrow();
            });

            it('should throw an error if a non-function and non-false handler is given', function () {
                var queue = new EventQueue();
                expect(function () { queue.add({}); }).toThrow();
            });
        });

        describe('`remove` method', function () {
            it('should exist', function () {
                var queue = new EventQueue();
                expect(queue.remove).toBeOfType('function');
            });

            it('should be safe to remove an attached handler', function () {
                var queue = new EventQueue();
                var handler = function () {};
                queue.add(handler);
                expect(function () { queue.remove(handler); }).not.toThrow();
            });

            it('should be safe to remove a non-attached handler', function () {
                var queue = new EventQueue();
                var handler = function () {};
                expect(function () { queue.remove(handler); }).not.toThrow();
            });

            it('should be safe to remove all handlers by not providing `handler` argument', function () {
                var queue = new EventQueue();
                expect(function () { queue.remove(); }).not.toThrow();
            });
        });

        describe('`clear` method', function () {
            it('should exist', function () {
                var queue = new EventQueue();
                expect(queue.clear).toBeOfType('function');
            });

            it('should be safe to clear the queue', function () {
                var queue = new EventQueue();
                expect(function () { queue.clear(); }).not.toThrow();
            });
        });

        describe('`exeute` method', function () {
            it('should exist', function () {
                var queue = new EventQueue();
                expect(queue.execute).toBeOfType('function');
            });

            it('should pass the `event` object to handler', function () {
                var queue = new EventQueue();
                var handler = jasmine.createSpy('handler');
                queue.add(handler);
                var event = {};
                queue.execute(event, null);
                expect(handler).toHaveBeenCalled();
                expect(handler.mostRecentCall.args[0]).toBe(event);
            });

            it('should pass the `thisObject` object as `this` to handler', function () {
                var queue = new EventQueue();
                var handler = jasmine.createSpy('handler');
                queue.add(handler);
                var thisObject = {};
                queue.execute({}, thisObject);
                expect(handler).toHaveBeenCalled();
                expect(handler.mostRecentCall.object).toBe(thisObject);
            });

            it('should use the `thisObject` specified when add instead of the given one', function () {
                var queue = new EventQueue();
                var handler = jasmine.createSpy('handler');
                var thisObject = {};
                queue.add(handler, { thisObject: thisObject });
                queue.execute({}, null);
                expect(handler).toHaveBeenCalled();
                expect(handler.mostRecentCall.object).toBe(thisObject);
            });

            it('should execute attached handler by attaching order', function () {
                var queue = new EventQueue();
                var order = [];
                var handlerA = function () { order.push(1) };
                var handlerB = function () { order.push(2) };
                queue.add(handlerA);
                queue.add(handlerB);
                queue.execute({}, null);
                expect(order).toEqual([1, 2]);
            });

            it('should not execute removed handler', function () {
                var queue = new EventQueue();
                var handlerA = jasmine.createSpy('handlerA');
                var handlerB = jasmine.createSpy('handlerB');
                queue.add(handlerA);
                queue.add(handlerB);
                queue.remove(handlerA);
                queue.execute({}, null);
                expect(handlerA).not.toHaveBeenCalled();
            });

            it('should not execute any handler if it is cleared', function () {
                var queue = new EventQueue();
                var handlerA = jasmine.createSpy('handlerA');
                var handlerB = jasmine.createSpy('handlerB');
                queue.add(handlerA);
                queue.add(handlerB);
                queue.remove();
                queue.execute({}, null);
                expect(handlerA).not.toHaveBeenCalled();
                expect(handlerB).not.toHaveBeenCalled();

                queue.add(handlerA);
                queue.add(handlerB);
                queue.clear();
                queue.execute({}, null);
                expect(handlerA).not.toHaveBeenCalled();
                expect(handlerB).not.toHaveBeenCalled();
            });

            it('should not execute removed handler event it is removed when the queue is executing', function () {
                var queue = new EventQueue();
                var handlerA = function () { queue.remove(handlerB); };
                var handlerB = jasmine.createSpy('handlerB');
                queue.add(handlerA);
                queue.add(handlerB);
                queue.execute({}, null);
                expect(handlerB).not.toHaveBeenCalled();
            });

            it('should execute handler only once if `once` option is specified', function () {
                var queue = new EventQueue();
                var handler = jasmine.createSpy();
                queue.add(handler, { once: true });
                queue.execute({}, null);
                queue.execute({}, null);
                expect(handler.callCount).toBe(1);
            });

            it('should keep all handler in order and executed even one handler is removed when executing', function () {
                var queue = new EventQueue();
                var handlerA = jasmine.createSpy('handlerA').andCallFake(function () { queue.remove(handlerB); });
                var handlerB = jasmine.createSpy('handlerB');
                var handlerC = jasmine.createSpy('handlerC');
                var handlerD = jasmine.createSpy('handlerD');
                queue.add(handlerA);
                queue.add(handlerB);
                queue.add(handlerC);
                queue.add(handlerD);
                queue.execute({}, null);
                expect(handlerA).toHaveBeenCalled();
                expect(handlerC).toHaveBeenCalled();
                expect(handlerD).toHaveBeenCalled();
            });

            it('should not execute following handlers if event is immediately stopped', function () {
                var queue = new EventQueue();
                var event = {
                    isImmediatePropagationStopped: function () { return false; }
                };
                var handlerA = function () {
                    event.isImmediatePropagationStopped = function () { return true; }
                };
                var handlerB = jasmine.createSpy('handlerB');
                queue.add(handlerA);
                queue.add(handlerB);
                queue.execute(event, null);
                expect(handlerB).not.toHaveBeenCalled();
            });

            it('should not execute duplicated handlers', function () {
                var queue = new EventQueue();
                var handler = jasmine.createSpy('handler');
                queue.add(handler);
                queue.add(handler);
                queue.execute({}, null);
                expect(handler.callCount).toBe(1);
            });

            it('should treated the same handler with different `thisObject` to be different', function () {
                var queue = new EventQueue();
                var handler = jasmine.createSpy('handler');
                queue.add(handler, { thisObject: { x: 1 } });
                queue.add(handler, { thisObject: { x: 2 } });
                queue.execute({}, null);
                expect(handler.callCount).toBe(2);
            });

            it('should not remove the handler if with different `thisObject`', function () {
                var queue = new EventQueue();
                var handler = jasmine.createSpy('handler');
                var x = { x: 1 };
                var y = { x: 2 };
                queue.add(handler, { thisObject: x });
                queue.add(handler, { thisObject: y });
                queue.remove(handler, x);
                queue.execute({}, null);
                expect(handler.callCount).toBe(1);
            });

            it('should not remove handlers with custom `thieObject` if `thisObject` is not given as a argument', function () {
                var queue = new EventQueue();
                var handler = jasmine.createSpy('handler');
                var x = { x: 1 };
                queue.add(handler, { thisObject: x });
                queue.add(handler);
                queue.remove(handler);
                queue.execute({}, null);
                expect(handler.callCount).toBe(1);
            });

            it('should treat a `false` handler as `preventDefault` & `stopPropagation`', function () {
                var queue = new EventQueue();
                queue.add(false);
                var event = {
                    preventDefault: jasmine.createSpy('preventDefault'),
                    stopPropagation: jasmine.createSpy('stopPropagation')
                };
                queue.execute(event);
                expect(event.preventDefault).toHaveBeenCalled();
                expect(event.stopPropagation).toHaveBeenCalled();
            });

            it('should be ok to remove a `false` handler', function () {
                var queue = new EventQueue();
                queue.add(false);
                queue.remove(false);
                var event = {
                    preventDefault: jasmine.createSpy('preventDefault'),
                    stopPropagation: jasmine.createSpy('stopPropagation')
                };
                queue.execute(event);
                expect(event.preventDefault).not.toHaveBeenCalled();
                expect(event.stopPropagation).not.toHaveBeenCalled();
            });

            it('should be safe to dispose the queue when executing, all remaining handlers should not be called', function () {
                var queue = new EventQueue();
                queue.add(function () { queue.dispose(); });
                var handler = jasmine.createSpy('handler');
                queue.add(handler);
                expect(function () { queue.execute({}); }).not.toThrow();
                expect(handler).not.toHaveBeenCalled();
            });
        });

        describe('`getLength` method', function () {
            it('should exists', function () {
                var queue = new EventQueue();
                expect(queue.getLength).toBeOfType('function');
            });

            it('should have an alias method named `length`', function () {
                var queue = new EventQueue();
                expect(queue.length).toBe(queue.getLength);
            });

            it('should increment when an handler is added', function () {
                var queue = new EventQueue();
                queue.add(function () {});
                expect(queue.getLength()).toBe(1);
            });

            it('should increment when `false` is added as a handler', function () {
                var queue = new EventQueue();
                queue.add(false);
                expect(queue.getLength()).toBe(1);
            });

            it('should decrement when an handler is removed', function () {
                var queue = new EventQueue();
                var handler = function () {};
                queue.add(handler);
                queue.remove(handler);
                expect(queue.getLength()).toBe(0);
            });
        });
    });
});
