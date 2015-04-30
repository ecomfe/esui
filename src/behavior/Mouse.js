/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 鼠标事件
 * @author maoquan(3610cn@gmail.com)
 */

define(
    function(require) {

        var $ = require('jquery');
        var lib = require('esui/lib');

        var Base = require('./Base');

        var mouseHandled = false;
        $(document).mouseup(
            function() {
                mouseHandled = false;
            }
        );

        var exports = {};

        exports.type = 'mouse';

        exports.constructor = function (options) {
            this.$super(arguments);
            this.options = {};
            lib.extend(this.options, this.$self.defaultProperties, options);

            // 记录上一次mousedown事件对象
            this.mouseDownEvent = null;
            // 是否在文档内移动过鼠标
            this.mouseMoved = false;
            // 初始化
            this.init();
        };

        exports.init = function() {
            var me = this;
            var element = $(this.element)[0];
            element = $(element);

            element.bind(
                'mousedown.' + this.type,
                function(event) {
                    return mouseDown.call(me, event);
                }
            ).bind(
                'click.' + this.type,
                function(event) {
                    if (true === $.data(event.target, me.type + '.preventClickEvent')) {
                        $.removeData(event.target, me.type + '.preventClickEvent');
                        event.stopImmediatePropagation();
                        return false;
                    }
                }
            );
            this.started = false;
        };

        // TODO: make sure destroying one instance of mouse doesn't mess with
        // other instances of mouse
        function mouseDestroy() {
            this.element.unbind('.' + this.type);
            if (this.mouseMoveDelegate) {
                this.document
                    .unbind('mousemove.' + this.type, this.mouseMoveDelegate)
                    .unbind('mouseup.' + this.type, this.mouseUpDelegate);
            }
        }

        function mouseDown(event) {
            // don't let more than one widget handle mouseStart
            if (mouseHandled) {
                return;
            }

            this.mouseMoved = false;

            // we may have missed mouseup (out of window)
            (this.mouseStarted && mouseUp.call(this, event));

            this.mouseDownEvent = event;

            var me = this;
            var btnIsLeft = (event.which === 1);
                // event.target.nodeName works around a bug in IE 8 with
                // disabled inputs (#7620)
            var elIsCancel = (typeof this.options.cancel === 'string' && event.target.nodeName ? $(event.target).closest(this.options.cancel).length : false);
            if (!btnIsLeft || elIsCancel || !mouseCapture.call(this, event)) {
                return true;
            }

            this.mouseDelayMet = !this.options.delay;
            if (!this.mouseDelayMet) {
                this.mouseDelayTimer = setTimeout(function() {
                    me.mouseDelayMet = true;
                }, this.options.delay);
            }

            if (mouseDistanceMet.call(this, event) && mouseDelayMet.call(this, event)) {
                this.mouseStarted = mouseStart.call(this, event);
                if (!this.mouseStarted) {
                    event.preventDefault();
                    return true;
                }
            }

            // Click event may never have fired (Gecko & Opera)
            if (true === $.data(event.target, this.type + '.preventClickEvent')) {
                $.removeData(event.target, this.type + '.preventClickEvent');
            }

            // these delegates are required to keep context
            this.mouseMoveDelegate = function(event) {
                return mouseMove.call(me, event);
            };
            this.mouseUpDelegate = function(event) {
                return mouseUp.call(me, event);
            };

            this.document
                .bind('mousemove.' + this.type, this.mouseMoveDelegate)
                .bind('mouseup.' + this.type, this.mouseUpDelegate);

            event.preventDefault();

            mouseHandled = true;
            return true;
        }

        function mouseMove(event) {
            // Only check for mouseups outside the document if you've moved inside the document
            // at least once. This prevents the firing of mouseup in the case of IE<9, which will
            // fire a mousemove event if content is placed under the cursor. See #7778
            // Support: IE <9
            if (this.mouseMoved) {
                // IE mouseup check - mouseup happened when mouse was out of window
                var ie = !-[1,];
                if (ie && (!document.documentMode || document.documentMode < 9) && !event.button) {
                    return mouseUp.call(this, event);

                // Iframe mouseup check - mouseup occurred in another document
                }
                else if (!event.which) {
                    return mouseUp.call(this, event);
                }
            }

            if (event.which || event.button) {
                this.mouseMoved = true;
            }

            if (this.mouseStarted) {
                mouseDrag.call(this, event);
                return event.preventDefault();
            }

            if (mouseDistanceMet.call(this, event) && mouseDelayMet.call(this, event)) {
                console.log('met')
                // TODO: 是否要传mouseDownEvent
                this.mouseStarted = mouseStart.call(this, event);
                (this.mouseStarted ? mouseDrag.call(this, event) : mouseUp.call(this, event));
            }

            return !this.mouseStarted;
        }

        function mouseUp(event) {
            this.document
                .unbind('mousemove.' + this.type, this.mouseMoveDelegate)
                .unbind('mouseup.' + this.type, this.mouseUpDelegate);

            if (this.mouseStarted) {
                this.mouseStarted = false;

                if (event.target === this.mouseDownEvent.target) {
                    $.data(event.target, this.type + '.preventClickEvent', true);
                }
                mouseStop.call(this, event);
            }

            mouseHandled = false;
            return false;
        }

        function mouseDistanceMet(event) {
            return Math.max(
                    Math.abs(this.mouseDownEvent.pageX - event.pageX),
                    Math.abs(this.mouseDownEvent.pageY - event.pageY)
               ) >= this.options.distance;
        }

        function mouseDelayMet() {
            return this.mouseDelayMet;
        }

        function mouseStart(event) {
            var miniEvent = this.fire('mousestart', event);
            return !miniEvent.isDefaultPrevented();
        }

        function mouseDrag(event) {
            this.fire('mousedrag', event);
        }

        function mouseCapture(event) {
            var miniEvent = this.fire('mousecapture', event);
            if (miniEvent.isDefaultPrevented()) {
                return false;
            }
            return true;
        }

        function mouseStop(event) {
            this.fire('mousestop', event);
        }

        var Mouse = require('eoo').create(Base, exports);
        Mouse.defaultProperties = {
            cancel: 'input, textarea, button, select, option',
            distance: 1,
            delay: 0
        };

        return Mouse;

    }
);
