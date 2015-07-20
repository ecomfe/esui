/**
 * jQuery 'splendid textchange' plugin
 * http://benalpert.com/2013/06/18/a-near-perfect-oninput-shim-for-ie-8-and-9.html
 *
 * (c) 2013 Ben Alpert, released under the MIT license
 *
 * @file 修复text input 事件兼容性：
 *  1. IE8 propertychange循环触发
 *  2. IE9 delete / backspace 不触发input
 * @author spicyj@github
 */

define(
    function (require) {

        var $ = require('jquery');

        var testNode = document.createElement('input');
        var isInputSupported = 'oninput' in testNode
            && (!('documentMode' in document) || document.documentMode > 9);

        var hasInputCapabilities = function (elem) {
            // The HTML5 spec lists many more types than `text` and `password` on
            // which the input event is triggered but none of them exist in IE 8 or
            // 9, so we don't check them here.
            // TODO: <textarea> should be supported too but IE seems to reset the
            // selection when changing textarea contents during a selectionchange
            // event so it's not listed here for now.
            return elem.nodeName === 'INPUT'
                && (elem.type === 'text' || elem.type === 'password')
                || elem.nodeName === 'TEXTAREA';
        };

        var activeElement = null;
        var activeElementValue = null;
        var activeElementValueProp = null;

        /**
         * (For old IE.) Replacement getter/setter for the `value` property that
         * gets set on the active element.
         */
        var newValueProp =  {
            get: function () {
                return activeElementValueProp.get.call(this);
            },
            set: function (val) {
                activeElementValue = val;
                activeElementValueProp.set.call(this, val);
            }
        };

        /**
         * (For old IE.) Handles a propertychange event, sending a textChange event if
         * the value of the active element has changed.
         *
         * @param {Event} nativeEvent 事件对象
         */
        var handlePropertyChange = function (nativeEvent) {
            if (nativeEvent.propertyName !== 'value') {
                return;
            }

            var value = nativeEvent.srcElement.value;
            if (value === activeElementValue) {
                return;
            }
            activeElementValue = value;

            var event = $.Event(nativeEvent);
            event.type = 'textchange';
            $(activeElement).trigger(event);
        };

        /**
         * (For old IE.) Starts tracking propertychange events on the passed-in element
         * and override the value property so that we can distinguish user events from
         * value changes in JS.
         * @param {Element} target 要监听的元素
         */
        var startWatching = function (target) {
            activeElement = target;
            activeElementValue = target.value;
            activeElementValueProp = Object.getOwnPropertyDescriptor(
                target.constructor.prototype, 'value'
            );
            Object.defineProperty(activeElement, 'value', newValueProp);
            activeElement.attachEvent('onpropertychange', handlePropertyChange);
        };

        /**
         * (For old IE.) Removes the event listeners from the currently-tracked
         * element, if any exists.
         */
        var stopWatching = function () {
            if (!activeElement) {
                return;
            }

            // delete restores the original property definition
            delete activeElement.value;
            activeElement.detachEvent('onpropertychange', handlePropertyChange);

            activeElement = null;
            activeElementValue = null;
            activeElementValueProp = null;
        };

        if (isInputSupported) {
            $(document).on(
                'input',
                function (event) {
                    // In modern browsers (i.e., not IE 8 or 9), the input event is
                    // exactly what we want so fall through here and trigger the
                    // event...
                    var target = event.target;
                    if ( true || target.nodeName !== 'TEXTAREA') {
                        // ...unless it's a textarea, in which case we don't fire an
                        // event (so that we have consistency with our old-IE shim).
                        event.type = 'textchange';
                        $(target).trigger(event);
                    }
                }
            );
        }
        else {
            $(document).on(
                'focusin',
                function (event) {
                    // In IE 8, we can capture almost all .value changes by adding a
                    // propertychange handler and looking for events with propertyName
                    // equal to 'value'.
                    // In IE 9, propertychange fires for most input events but is buggy
                    // and doesn't fire when text is deleted, but conveniently,
                    // selectionchange appears to fire in all of the remaining cases so
                    // we catch those and forward the event if the value has changed.
                    // In either case, we don't want to call the event handler if the
                    // value is changed from JS so we redefine a setter for `.value`
                    // that updates our activeElementValue variable, allowing us to
                    // ignore those changes.
                    var target = event.target;
                    if (hasInputCapabilities(target)) {
                        // stopWatching() should be a noop here but we call it just in
                        // case we missed a blur event somehow.
                        stopWatching();
                        startWatching(target);
                    }
                }
            ).on(
                'focusout',
                function () {
                    stopWatching();
                }
            ).on(
                'selectionchange keyup keydown',
                function (event) {
                    // On the selectionchange event, event.target is just document which
                    // isn't helpful for us so just check activeElement instead.
                    //
                    // 90% of the time, keydown and keyup aren't necessary. IE 8 fails
                    // to fire propertychange on the first input event after setting
                    // `value` from a script and fires only keydown, keypress, keyup.
                    // Catching keyup usually gets it and catching keydown lets us fire
                    // an event for the first keystroke if user does a key repeat
                    // (it'll be a little delayed: right before the second keystroke).
                    // Other input methods (e.g., paste) seem to fire selectionchange
                    // normally.
                    if (activeElement && activeElement.value !== activeElementValue) {
                        activeElementValue = activeElement.value;
                        event.type = 'textchange';
                        $(activeElement).trigger(event);
                    }
                }
            );
        }
    }
);
