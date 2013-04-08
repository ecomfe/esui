define(function (require) {
    var helper = require('esui/controlHelper');

    function dispatchEvent(element, type) {
        if (typeof document.createEvent === 'function') {
            var event = document.createEvent('Event');
            event.initEvent(type, true, false);
            element.dispatchEvent(event);
        }
        else {
            var event = document.createEventObject();
            element.fireEvent('on' + type, event);
        }
    }

    describe('controlHelper', function () {
        it('should be an object', function () {
            expect(helper).toBeOfType('object');
        });

        describe('dom event module', function () {
            it('should have a `addDOMEvent` method', function () {
                expect(helper.addDOMEvent).toBeOfType('function');
            });

            it('should have a `removeDOMEvent` method', function () {
                expect(helper.addDOMEvent).toBeOfType('function');
            });

            it('should have a `clearDOMEvents` method', function () {
                expect(helper.addDOMEvent).toBeOfType('function');
            });

            describe('`addDOMEvent` method', function () {
                it('should add an event to DOM element', function () {
                    var control = {};
                    var element = document.createElement('div');
                    document.getElementById('container').appendChild(element);
                    var handler = jasmine.createSpy();

                    helper.addDOMEvent(control, element, 'click', handler);
                    dispatchEvent(element, 'click');
                    expect(handler).toHaveBeenCalled();
                });

                it('should call event listener with a full w3c-compatible Event object', function () {
                    var control = {};
                    var element = document.createElement('div');
                    document.getElementById('container').appendChild(element);
                    var handler = jasmine.createSpy();

                    helper.addDOMEvent(control, element, 'click', handler);
                    dispatchEvent(element, 'click');
                    var event = handler.mostRecentCall.args[0];
                    expect(event).toBeDefined();
                    expect(event.type).toBe('click');
                    expect(event.target).toBe(element);
                    expect(event.stopPropagation).toBeOfType('function');
                    expect(event.preventDefault).toBeOfType('function');
                });

                it('should call event listeners attached to a parent element if child element fires the event', function () {
                    var control = {};
                    var parent = document.createElement('div');
                    var child = document.createElement('div');
                    parent.appendChild(child);
                    document.getElementById('container').appendChild(parent);
                    var handler = jasmine.createSpy();

                    helper.addDOMEvent(control, parent, 'click', handler);
                    dispatchEvent(child, 'click');
                    expect(handler).toHaveBeenCalled();
                })

                it('should call all event listeners when dom event is fired', function () {
                    var control = {};
                    var element = document.createElement('div');
                    document.getElementById('container').appendChild(element);
                    var handlerA = jasmine.createSpy();
                    var handlerB = jasmine.createSpy();

                    helper.addDOMEvent(control, element, 'click', handlerA);
                    helper.addDOMEvent(control, element, 'click', handlerB);
                    dispatchEvent(element, 'click');
                    expect(handlerA).toHaveBeenCalled();
                    expect(handlerB).toHaveBeenCalled();
                });


                it('should call event listeners with attach order', function () {
                    var control = {};
                    var element = document.createElement('div');
                    document.getElementById('container').appendChild(element);
                    var queue = [];
                    function handlerA() { queue.push('a'); }
                    function handlerB() { queue.push('b'); }

                    helper.addDOMEvent(control, element, 'click', handlerA);
                    helper.addDOMEvent(control, element, 'click', handlerB);
                    dispatchEvent(element, 'click');
                    expect(queue.join('')).toBe('ab');
                });
            });

            describe('`removeDOMEvent` method', function () {
                it('should remove an attached event listener', function () {
                    var control = {};
                    var element = document.createElement('div');
                    document.getElementById('container').appendChild(element);
                    var handler = jasmine.createSpy();

                    helper.addDOMEvent(control, element, 'click', handler);
                    helper.removeDOMEvent(control, element, 'click', handler);
                    dispatchEvent(element, 'click');
                    expect(handler).not.toHaveBeenCalled();
                });

                it('should remove all event listeners if `handler` argument is omitted', function () {
                    var control = {};
                    var element = document.createElement('div');
                    document.getElementById('container').appendChild(element);
                    var handlerA = jasmine.createSpy();
                    var handlerB = jasmine.createSpy();

                    helper.addDOMEvent(control, element, 'click', handlerA);
                    helper.addDOMEvent(control, element, 'click', handlerB);
                    helper.removeDOMEvent(control, element, 'click');
                    dispatchEvent(element, 'click');
                    expect(handlerA).not.toHaveBeenCalled();
                    expect(handlerB).not.toHaveBeenCalled();
                });

                it('should be ok if removing event handler is not already attached', function () {
                    var control = {};
                    var element = document.createElement('div');
                    document.getElementById('container').appendChild(element);
                    var handler = jasmine.createSpy();
                    expect(function () { helper.removeDOMEvent(control, element, 'click', handler) }).not.toThrow();
                });

                it('should be ok to remove an certain type of event if no event listeners are attached', function () {
                    var control = {};
                    var element = document.createElement('div');
                    document.getElementById('container').appendChild(element);
                    expect(function () { helper.removeDOMEvent(control, element, 'click') }).not.toThrow();
                });
            });

            describe('`clearDOMEvents` method', function () {
                it('should remove all events from a given element', function () {
                    var control = {};
                    var element = document.createElement('div');
                    document.getElementById('container').appendChild(element);
                    var handlerA = jasmine.createSpy();
                    var handlerB = jasmine.createSpy();
                    var handlerC = jasmine.createSpy();
                    helper.addDOMEvent(control, element, 'click', handlerA);
                    helper.addDOMEvent(control, element, 'click', handlerB);
                    helper.addDOMEvent(control, element, 'mousedown', handlerC);
                    helper.clearDOMEvents(control, element);
                    dispatchEvent(element, 'click');
                    dispatchEvent(element, 'mousedown');
                    expect(handlerA).not.toHaveBeenCalled();
                    expect(handlerB).not.toHaveBeenCalled();
                    expect(handlerC).not.toHaveBeenCalled();
                });

                it('should remove all events from all elements if `element` argument is omitted', function () {
                    var control = {};
                    var elementA = document.createElement('div');
                    var elementB = document.createElement('div');
                    document.getElementById('container').appendChild(elementA);
                    document.getElementById('container').appendChild(elementB);
                    var handlerA = jasmine.createSpy();
                    var handlerB = jasmine.createSpy();
                    helper.addDOMEvent(control, elementA, 'click', handlerA);
                    helper.addDOMEvent(control, elementB, 'click', handlerB);
                    helper.clearDOMEvents(control);
                    dispatchEvent(elementA, 'click');
                    dispatchEvent(elementB, 'click');
                    expect(handlerA).not.toHaveBeenCalled();
                    expect(handlerB).not.toHaveBeenCalled();
                });
            });
        });
    });
});