define(function() {
    var EventTarget = require('mini-event/EventTarget');
    var Event = require('mini-event/Event');

    describe('EventTarget', function() {
        it('should be a construtor', function () {
            expect(EventTarget).toBeOfType('function');
        });

        it('should be instantiable', function () {
            expect(new EventTarget()).toBeOfType('object');
        });
        
        describe('`on` method', function() {
            it('should exist', function () {
                var eventTarget = new EventTarget();
                expect(eventTarget.on).toBeOfType('function');
            });

            it('should be safe to attach a handler for a named event', function () {
                var eventTarget = new EventTarget();
                expect(function () { eventTarget.on('change', function () {}); }).not.toThrow();
            });

            it('should be safe to attach a global event handler', function () {
                var eventTarget = new EventTarget();
                expect(function () { eventTarget.on('*', function () {}); }).not.toThrow();
            });

            it('should be safe to specify a `this` object', function () {
                var eventTarget = new EventTarget();
                var fn = function () {};
                expect(function () { eventTarget.on('change', fn, {}); }).not.toThrow();
            });


            it('should be safe to specify a `options` object', function () {
                var eventTarget = new EventTarget();
                var fn = function () {};
                expect(function () { eventTarget.on('change', fn, {}, { once: true }); }).not.toThrow();
            });
        });

        describe('`once` method', function () {
            it('should exist', function () {
                var eventTarget = new EventTarget();
                expect(eventTarget.once).toBeOfType('function');
            });

            it('should be safe to attach a handler for a named event', function () {
                var eventTarget = new EventTarget();
                expect(function () { eventTarget.once('change', function () {}); }).not.toThrow();
            });

            it('should be safe to specify a `this` object', function () {
                var eventTarget = new EventTarget();
                var fn = function () {};
                expect(function () { eventTarget.on('change', fn, {}); }).not.toThrow();
            });

            it('should be safe to attach a global event handler', function () {
                var eventTarget = new EventTarget();
                expect(function () { eventTarget.once('*', function () {}); }).not.toThrow();
            });

            it('should be safe to specify a `options` object', function () {
                var eventTarget = new EventTarget();
                var fn = function () {};
                expect(function () { eventTarget.on('change', fn, {}, { once: false }); }).not.toThrow();
            });
        });

        describe('`un` method', function() {
            it('should exist', function () {
                var eventTarget = new EventTarget();
                expect(eventTarget.un).toBeOfType('function');
            });

            it('should be safe to remove an attached handler', function () {
                var fn = function () {};
                var eventTarget = new EventTarget();
                eventTarget.on('change', fn);
                expect(function () { eventTarget.un('change', fn); }).not.toThrow();
            });

            it('should be safe to remove all event handlers by not providing a specified handler', function () {
                var fn = function () {};
                var eventTarget = new EventTarget();
                eventTarget.on('change', fn);
                expect(function () { eventTarget.un('change'); }).not.toThrow();
            });

            it('should be safe to remove a non-attached handler', function () {
                var fn = function () {};
                var eventTarget = new EventTarget();
                expect(function () { eventTarget.un('change', fn); }).not.toThrow();
            });

            it('should be safe to remove a type of event with no handler initialized', function () {
                var eventTarget = new EventTarget();
                expect(function () { eventTarget.un('change'); }).not.toThrow();
            });
        });

        describe('`fire` method', function() {
            it('should exist', function () {
                var eventTarget = new EventTarget();
                expect(eventTarget.fire).toBeOfType('function');
            });

            it('should execute all named event handlers', function () {
                var eventTarget = new EventTarget();
                var handlerA = jasmine.createSpy('handlerA');
                var handlerB = jasmine.createSpy('handlerB');
                var handlerC = jasmine.createSpy('handlerC');
                eventTarget.on('change', handlerA);
                eventTarget.on('change', handlerB);
                eventTarget.on('change', handlerC);
                eventTarget.fire('change');
                expect(handlerA).toHaveBeenCalled();
                expect(handlerB).toHaveBeenCalled();
                expect(handlerC).toHaveBeenCalled();
            });

            it('should execute all global event handlers when any named event is fired', function () {
                var eventTarget = new EventTarget();
                var handlerA = jasmine.createSpy('handlerA');
                var handlerB = jasmine.createSpy('handlerB');
                var handlerC = jasmine.createSpy('handlerC');
                eventTarget.on('*', handlerA);
                eventTarget.on('*', handlerB);
                eventTarget.on('*', handlerC);
                eventTarget.fire('change');
                expect(handlerA).toHaveBeenCalled();
                expect(handlerB).toHaveBeenCalled();
                expect(handlerC).toHaveBeenCalled();
            });

            it('should be safe to fire an event with no handler initialized', function () {
                var eventTarget = new EventTarget();
                expect(function () { eventTarget.fire('change'); }).not.toThrow();
            });

            it('should return a correctly built `Event` object', function () {
                var eventTarget = new EventTarget();
                var event = eventTarget.fire('change');
                expect(event instanceof Event).toBe(true);
                expect(event.type).toBe('change');
                expect(event.target).toBe(eventTarget);
            });

            it('should accept an `Event` object and then return this object itself', function () {
                var eventTarget = new EventTarget();
                var event = new Event();
                var returnedEvent = eventTarget.fire('change', event);
                expect(returnedEvent).toBe(event);
            });

            it('should accept any object as event\'s data', function () {
                var eventTarget = new EventTarget();
                var event = eventTarget.fire('change', { x: 1 });
                expect(event.x).toBe(1);
            });

            it('should accept any non-object value and extend it to event object as the `data` property', function () {
                var eventTarget = new EventTarget();
                var event = eventTarget.fire('change', 1);
                expect(event.data).toBe(1);
            });

            it('should accept only one object as arguments', function () {
                var eventTarget = new EventTarget();
                var event = eventTarget.fire({ type: 'change', x: 1 });
                expect(event.type).toBe('change');
                expect(event.x).toBe(1);
            });

            it('should call inline handler', function () {
                var eventTarget = new EventTarget();
                eventTarget.onchange = jasmine.createSpy();
                eventTarget.fire('change');
                expect(eventTarget.onchange).toHaveBeenCalled();
            });

            it('should pass the event object to handlers', function () {
                var eventTarget = new EventTarget();
                var handler = jasmine.createSpy('handler');
                eventTarget.on('change', handler);
                var event = eventTarget.fire('change');
                expect(handler.mostRecentCall.args[0]).toBe(event);
            });

            it('should call handlers specified as `once` only once', function () {
                var eventTarget = new EventTarget();
                var handlerA = jasmine.createSpy('handlerA');
                var handlerB = jasmine.createSpy('handlerB');
                eventTarget.on('change', handlerA, null, { once: true });
                eventTarget.once('change', handlerB);
                eventTarget.fire('change');
                eventTarget.fire('change');
                expect(handlerA.callCount).toBe(1);
                expect(handlerB.callCount).toBe(1);
            });

            it('should pass the `thisObject` as handler\'s `this`', function () {
                var eventTarget = new EventTarget();
                var thisObject = {};
                var handlerA = jasmine.createSpy('handlerA');
                var handlerB = jasmine.createSpy('handlerB');
                eventTarget.on('change', handlerA, thisObject);
                eventTarget.on('change', handlerB, null, { thisObject: thisObject });
                eventTarget.fire('change');
                expect(handlerA.mostRecentCall.object).toBe(thisObject);
                expect(handlerB.mostRecentCall.object).toBe(thisObject);
            });

            it('should pass the EventTarget object itself as `this` if `thisObject` is given a null value', function () {
                var eventTarget = new EventTarget();
                var handlerA = jasmine.createSpy('handlerA');
                var handlerB = jasmine.createSpy('handlerB');
                eventTarget.on('change', handlerA, null);
                eventTarget.on('change', handlerB, undefined);
                eventTarget.fire('change');
                expect(handlerA.mostRecentCall.object).toBe(eventTarget);
                expect(handlerB.mostRecentCall.object).toBe(eventTarget);
            });

            it('should be safe to dispose itself when executing handlers, all remaining handlers should not be called', function () {
                var eventTarget = new EventTarget();
                eventTarget.on('change', function () { eventTarget.destroyEvents(); });
                var handler = jasmine.createSpy('handler');
                eventTarget.on('change', handler);
                expect(function () { eventTarget.fire('change'); }).not.toThrow();
                expect(handler).not.toHaveBeenCalled();
            });

            it('should not execute global event handlers (those registered with `*`) when disposed on executing', function () {
                var eventTarget = new EventTarget();
                eventTarget.on('change', function () { eventTarget.destroyEvents(); });
                var handler = jasmine.createSpy('handler');
                eventTarget.on('*', handler);
                expect(function () { eventTarget.fire('change'); }).not.toThrow();
                expect(handler).not.toHaveBeenCalled();
            });
        });

        describe('`destroyEvents` method', function () {
            it('should exist', function () {
                var eventTarget = new EventTarget();
                expect(eventTarget.destroyEvents).toBeOfType('function');
            });

            it('should remove all events', function () {
                var eventTarget = new EventTarget();
                var handler = jasmine.createSpy('handler');
                eventTarget.on('change', handler);
                eventTarget.destroyEvents();
                eventTarget.fire('change');
                expect(handler).not.toHaveBeenCalled();
            });

            it('should works silently when no events are initialized', function () {
                var eventTarget = new EventTarget();
                expect(function () { eventTarget.destroyEvents(); }).not.toThrow();
            });
        });

        describe('`enable` method', function() {
            it('should exist', function () {
                expect(EventTarget.enable).toBeOfType('function');
            });

            it('make a Object has the function of EventTarget without inherit', function() {
                var obj = {};
                EventTarget.enable(obj);
                expect(obj.on).toBe(EventTarget.prototype.on);
                expect(obj.once).toBe(EventTarget.prototype.once);
                expect(obj.un).toBe(EventTarget.prototype.un);
                expect(obj.fire).toBe(EventTarget.prototype.fire);
            });
        });
    });
});