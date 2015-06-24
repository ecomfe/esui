define(function (require) {
    var helper = require('esui/controlHelper');
    var ui = require('esui');

    describe('controlHelper', function () {
        it('should be an object', function () {
            expect(helper).toBeOfType('object');
        });

        describe('getGUID method', function () {
            it('should exists', function () {
                expect(helper.getGUID).toBeOfType('function');
            });

            it('should return a string', function () {
                expect(helper.getGUID()).toBeOfType('string');
            })

            it('should return a different value on each invocation', function () {
                var first = helper.getGUID();
                var second = helper.getGUID();
                expect(first).not.toBe(second);
            });
        });

        describe('initViewContext method', function () {
            it('should exists', function () {
                expect(helper.initViewContext).toBeOfType('function');
            });

            it('should set the attached `viewContext` to control', function () {
                var viewContext = {};
                var control = {
                    setViewContext: jasmine.createSpy(),
                    viewContext: viewContext
                };
                helper.initViewContext(control);
                expect(control.setViewContext).toHaveBeenCalled();
                expect(control.setViewContext.mostRecentCall.args[0]).toBe(viewContext);
            });

            it('should give the default view context is no `viewContext` is attached to control', function () {
                var control = {
                    setViewContext: jasmine.createSpy()
                };
                helper.initViewContext(control);
                expect(control.setViewContext).toHaveBeenCalled();
                expect(control.setViewContext.mostRecentCall.args[0]).toBe(ui.getViewContext());
            });
        });

        describe('initExtensions method', function () {
            it('should exists', function () {
                expect(helper.initExtensions).toBeOfType('function');
            });

            // TODO: 耦合太厉害，一测就影响main，不好控制
        });

        describe('getPartClasses method', function () {
            it('should exists', function () {
                expect(helper.getPartClasses).toBeOfType('function');
            });

            describe('with skin defined', function () {
                it('should return the correct part class list', function () {
                    var control = {
                        type: 'TyPe',
                        skin: 'default'
                    };
                    var classes = helper.getPartClasses(control, 'test');
                    var expectResult = [
                        'ui-type-test',
                        'skin-default-type-test'
                    ];
                    expect(classes).toEqual(expectResult);
                });

                it('should return the correct class list for control itself', function () {
                    var control = {
                        type: 'TyPe',
                        skin: 'default'
                    };
                    var classes = helper.getPartClasses(control);
                    var expectResult = [
                        'ui-ctrl',
                        'ui-type',
                        'skin-default',
                        'skin-default-type'
                    ];
                    expect(classes).toEqual(expectResult);
                });
            });

            describe('without skin defined', function () {
                it('should return the correct part class list', function () {
                    var control = {
                        type: 'TyPe'
                    };
                    var classes = helper.getPartClasses(control, 'test');
                    var expectResult = [
                        'ui-type-test'
                    ];
                    expect(classes).toEqual(expectResult);
                });

                it('should return the correct class list for control itself', function () {
                    var control = {
                        type: 'TyPe'
                    };
                    var classes = helper.getPartClasses(control);
                    var expectResult = [
                        'ui-ctrl',
                        'ui-type'
                    ];
                    expect(classes).toEqual(expectResult);
                });
            });
        });

        describe('addPartClasses method', function () {
            it('should exists', function () {
                expect(helper.addPartClasses).toBeOfType('function');
            });

            it('should add correct classes to a part', function () {
                var control = {
                    type: 'TyPe',
                    skin: 'default'
                };
                var element = document.createElement('div');
                element.className = '';
                helper.addPartClasses(control, 'test', element);
                var expectResult = [
                    'ui-type-test',
                    'skin-default-type-test'
                ];
                expect(element.className.split(/\s+/)).toEqual(expectResult);
            });

            it('should add correct main classes to a part (though it should not be used in any of our code)', function () {
                var control = {
                    type: 'TyPe',
                    skin: 'default'
                };
                var element = document.createElement('div');
                helper.addPartClasses(control, null, element);
                var expectResult = [
                    'ui-ctrl',
                    'ui-type',
                    'skin-default',
                    'skin-default-type'
                ];
                expect(element.className.split(/\s+/)).toEqual(expectResult);
            });

            it('should add correct main classes to the main element', function () {
                var control = {
                    type: 'TyPe',
                    skin: 'default',
                    main: document.createElement('div')
                };
                helper.addPartClasses(control);
                var expectResult = [
                    'ui-ctrl',
                    'ui-type',
                    'skin-default',
                    'skin-default-type'
                ];
                expect(control.main.className.split(/\s+/)).toEqual(expectResult);
            });
        });

        describe('removePartClasses method', function () {
            it('should exists', function () {
                expect(helper.removePartClasses).toBeOfType('function');
            });

            it('should remove correct classes from a part', function () {
                var control = {
                    type: 'TyPe',
                    skin: 'default'
                };
                var element = document.createElement('div');
                element.className = 'ui-type-test skin-default-type-test';
                helper.removePartClasses(control, 'test', element);
                expect(element.className).toBe('');
            });

            it('should remove correct main classes from a part (though it should not be used in any of our code)', function () {
                var control = {
                    type: 'TyPe',
                    skin: 'default'
                };
                var element = document.createElement('div');
                element.className = 'ui-type skin-default skin-default-type';
                helper.removePartClasses(control, null, element);
                expect(element.className).toBe('');
            });

            it('should remove correct main classes from the main element', function () {
                var control = {
                    type: 'TyPe',
                    skin: 'default',
                    main: document.createElement('div')
                };
                control.main.className = 'ui-type skin-default skin-default-type';
                helper.removePartClasses(control);
                expect(control.main.className).toBe('');
            });
        });

        describe('getStateClasses method', function () {
            it('should exists', function () {
                expect(helper.getStateClasses).toBeOfType('function');
            });

            it('should get correct class list with skin defined', function () {
                var control = {
                    type: 'TyPe',
                    skin: 'default'
                };
                var classes = helper.getStateClasses(control, 'test');
                var expectResult = [
                    'ui-type-test',
                    'state-test',
                    'skin-default-test',
                    'skin-default-type-test'
                ];
                expect(classes).toEqual(expectResult);
            });

            it('should get correct class list without skin defined', function () {
                var control = {
                    type: 'TyPe'
                };
                var classes = helper.getStateClasses(control, 'test');
                var expectResult = [
                    'ui-type-test',
                    'state-test'
                ];
                expect(classes).toEqual(expectResult);
            });
        });

        describe('addStateClasses method', function () {
            it('should exists', function () {
                expect(helper.addStateClasses).toBeOfType('function');
            });

            it('should add correct class list to the main element', function () {
                var control = {
                    type: 'TyPe',
                    skin: 'default',
                    main: document.createElement('div')
                };
                helper.addStateClasses(control, 'test');
                var expectResult = [
                    'ui-type-test',
                    'state-test',
                    'skin-default-test',
                    'skin-default-type-test'
                ];
                expect(control.main.className.split(/\s+/)).toEqual(expectResult);
            });
        });

        describe('removeStateClasses method', function () {
            it('should exists', function () {
                expect(helper.removeStateClasses).toBeOfType('function');
            });

            it('should add correct class list to the main element', function () {
                var control = {
                    type: 'TyPe',
                    skin: 'default',
                    main: document.createElement('div')
                };
                control.main.className = 'ui-type-test state-test skin-default-test skin-default-type-test';
                helper.removeStateClasses(control, 'test');
                expect(control.main.className).toBe('');
            });
        });

        describe('getId method', function () {
            it('should exists', function () {
                expect(helper.getId).toBeOfType('function');
            });

            it('should return the correct id string', function () {
                var control = {
                    id: 'test',
                    viewContext: {
                        id: 'view'
                    }
                };
                var id = helper.getId(control);
                expect(id).toBe('ctrl-view-test');
            });

            it('should return the correct id string when no viewContext is associated', function () {
                var control = {
                    id: 'test'
                };
                var id = helper.getId(control);
                expect(id).toBe('ctrl-test');
            });

            it('should return the correct id string for a part', function () {
                var control = {
                    id: 'test',
                    viewContext: {
                        id: 'view'
                    }
                };
                var id = helper.getId(control, 'label');
                expect(id).toBe('ctrl-view-test-label');
            });

            it('should return the correct id string for a part when no viewContext is associated', function () {
                var control = {
                    id: 'test'
                };
                var id = helper.getId(control, 'label');
                expect(id).toBe('ctrl-test-label');
            });
        });

        describe('isInStage method', function () {
            it('should exists', function () {
                expect(helper.isInStage).toBeOfType('function');
            });

            it('should throw if an invalid stage string is given', function () {
                var control = {};
                expect(function () { helper.isInStage(control, 'NONE'); }).toThrow();
            });

            it('should return `true` if the control\'s `stage` matches the given value', function () {
                var control = {
                    stage: 1
                };
                expect(helper.isInStage(control, 'INITED')).toBe(true);
            });

            it('should return `false` if the control\'s `stage` does not match the given value', function () {
                var control = {
                    stage: 1
                };
                expect(helper.isInStage(control, 'RENDERED')).toBe(false);
            });
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
                });

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

                it('should be able to add event handler to global DOM object', function () {
                    var control = {};
                    var handler = jasmine.createSpy();
                    helper.addDOMEvent(control, document, 'click', handler);
                    dispatchEvent(document, 'click');
                    expect(handler).toHaveBeenCalled();
                    helper.clearDOMEvents(control);
                });

                it('should be able to call event handlers on different control for global DOM object', function () {
                    var controlA = {};
                    var controlB = {};
                    var handlerA = jasmine.createSpy('A');
                    var handlerB = jasmine.createSpy('B');
                    helper.addDOMEvent(controlA, document, 'click', handlerA);
                    helper.addDOMEvent(controlB, document, 'click', handlerB);
                    dispatchEvent(document, 'click');
                    expect(handlerA).toHaveBeenCalled();
                    expect(handlerB).toHaveBeenCalled();
                    helper.clearDOMEvents(controlA);
                    helper.clearDOMEvents(controlB);
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
                    expect(function () { helper.removeDOMEvent(control, element, 'click', handler); }).not.toThrow();
                });

                it('should be ok to remove an certain type of event with no listeners attached before event module is initialized', function () {
                    var control = {};
                    var element = document.createElement('div');
                    document.getElementById('container').appendChild(element);
                    expect(function () { helper.removeDOMEvent(control, element, 'click'); }).not.toThrow();
                });

                it('should be ok to remove an certain type of event with no listeners attached after event module is initialized', function () {
                    var control = {};
                    var element = document.createElement('div');
                    document.getElementById('container').appendChild(element);
                    helper.addDOMEvent(control, element, 'focus', function () {});
                    expect(function () { helper.removeDOMEvent(control, element, 'click'); }).not.toThrow();
                });

                it('should not call remvoed event listeners for global DOM object', function () {
                    var control = {};
                    var handlerA = jasmine.createSpy('A');
                    var handlerB = jasmine.createSpy('B');
                    helper.addDOMEvent(control, document, 'click', handlerA);
                    helper.addDOMEvent(control, document, 'click', handlerB);
                    helper.removeDOMEvent(control, document, 'click', handlerA);
                    dispatchEvent(document, 'click');
                    expect(handlerA).not.toHaveBeenCalled();
                    expect(handlerB).toHaveBeenCalled();
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

                it('should be ok if no event handler is not already attached', function () {
                    var control = {};
                    var element = document.createElement('div');
                    document.getElementById('container').appendChild(element);
                    var handler = jasmine.createSpy();
                    expect(function () { helper.clearDOMEvents(control); }).not.toThrow();
                });

                it('should not call listeners from a cleared control for global DOM object', function () {
                    var controlA = {}; 
                    var controlB = {}; 
                    var handlerA = jasmine.createSpy('A');
                    var handlerB = jasmine.createSpy('B');
                    helper.addDOMEvent(controlA, document, 'click', handlerA);
                    helper.addDOMEvent(controlB, document, 'click', handlerB);
                    helper.clearDOMEvents(controlA);
                    dispatchEvent(document, 'click');
                    expect(handlerA).not.toHaveBeenCalled();
                    expect(handlerB).toHaveBeenCalled();
                });
            });

            describe('when firing event', function () {
                it('should not execute handlers if contorl\'s `ignoreStates` contains a state that this control currently has', function () {
                    var control = {
                        ignoreStates: ['none', 'disabled'],
                        hasState: function (state) {
                            return state === 'disabled';
                        }
                    };
                    var element = document.createElement('div');
                    document.getElementById('container').appendChild(element);
                    var handler = jasmine.createSpy();
                    helper.addDOMEvent(control, element, 'click', handler);
                    dispatchEvent(element, 'click');
                    expect(handler).not.toHaveBeenCalled();
                });

                it('should execute handlers if control\'s `ignoreStates` doesn\'t contains any states this control current ly has', function () {
                    var control = {
                        ignoreStates: ['disabled'],
                        hasState: function (state) {
                            return false;
                        }
                    };
                    var element = document.createElement('div');
                    document.getElementById('container').appendChild(element);
                    var handler = jasmine.createSpy();
                    helper.addDOMEvent(control, element, 'click', handler);
                    dispatchEvent(element, 'click');
                    expect(handler).toHaveBeenCalled();
                });
            });
        });
    });
});