/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 鼠标事件
 * @author maoquan(3610cn@gmail.com)
 */

define(
    function (require) {

        var $ = require('jquery');
        var u = require('underscore');

        var Base = require('./Base');

        var mouseHandled = false;
        $(document).mouseup(
            function () {
                mouseHandled = false;
            }
        );

        /**
         * 抽象鼠标行为,包括鼠标事件的捕获、开始、移动、结束等，
         * 提供两种调用方式:
         * 1. 类调用
         *      var mouse = new Mouse(
         *          {
         *              distance: 2,
         *              delay: 10,
         *              ...
         *          },
         *          element
         *      );
         *      mouse.on('mousestart', function () {});
         *      mouse.on('mousedrag', function () {});
         *      mouse.on('mousestop', function () {});
         *
         * 2. jquery插件
         *      $(element).mouse(
         *          {
         *              distance: 2,
         *              delay: 10,
         *              onMousestart: function () {},
         *              onMousedrag: function () {},
         *              onMousestop: function () {}
         *          }
         *      );
         */
        var exports = {};

        exports.type = 'mouse';

        /**
         * 构造函数
         * @param {Object} options
         * options属性参考defaultProperties
         */
        exports.constructor = function (options) {
            this.$super(arguments);

            // 记录上一次mousedown事件对象
            this.mouseDownEvent = null;
            // 是否在文档内移动过鼠标
            this.mouseMoved = false;
        };

        /**
         * 初始化，主要是绑定元素的mousedown事件，作为鼠标事件起点
         */
        exports.init = function () {
            this.$super(arguments);

            var me = this;
            var element = $(this.element)[0];
            element = $(element);

            element.bind(
                'mousedown.' + this.type,
                function (event) {
                    return mouseDown.call(me, event);
                }
            ).bind(
                'click.' + this.type,
                function (event) {
                    if (true === $.data(event.target, me.type + '.preventClickEvent')) {
                        $.removeData(event.target, me.type + '.preventClickEvent');
                        event.stopImmediatePropagation();
                        return false;
                    }
                }
            );
            this.started = false;
        };

        /**
         * 销毁
         */
        exports.dispose = function () {
            this.element.unbind('.' + this.type);
            if (this.mouseMoveDelegate) {
                this.document
                    .unbind('mousemove.' + this.type, this.mouseMoveDelegate)
                    .unbind('mouseup.' + this.type, this.mouseUpDelegate);
            }
        };

        /**
         * 处理mousedown事件
         * @param {Event} event 事件对象
         * @return {boolean|Undefined}
         */
        function mouseDown(event) {
            // 只能有一个元素处理鼠标事件
            if (mouseHandled) {
                return;
            }

            this.mouseMoved = false;

            // we may have missed mouseup (out of window)
            (this.mouseStarted && mouseUp.call(this, event));

            this.mouseDownEvent = event;

            var me = this;
            var btnIsLeft = (event.which === 1);
                // event.target.nodeName works around a bug in IE 8 with disabled inputs (#7620)
            var elIsCancel = typeof this.options.cancel === 'string' && event.target.nodeName
                ? $(event.target).closest(this.options.cancel).length : false;
            if (!btnIsLeft || elIsCancel || !mouseCapture.call(this, event)) {
                return true;
            }

            this.mouseDelayMet = !this.options.delay;
            if (!this.mouseDelayMet) {
                this.mouseDelayTimer = setTimeout(function () {
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

            this.mouseMoveDelegate = function (event) {
                return mouseMove.call(me, event);
            };
            this.mouseUpDelegate = function (event) {
                return mouseUp.call(me, event);
            };

            this.document
                .bind('mousemove.' + this.type, this.mouseMoveDelegate)
                .bind('mouseup.' + this.type, this.mouseUpDelegate);

            event.preventDefault();

            mouseHandled = true;
            return true;
        }

        /**
         * 处理mousemove事件
         * @param {Event} event 事件对象
         *
         * @return {boolean}
         */
        function mouseMove(event) {
            if (this.mouseMoved) {
                var ie = !-[1,];
                // IE < 9的情况下，如果鼠标在文档外松开，则不会触发mouseup事件,因此需要手动调用
                if (ie && (!document.documentMode || document.documentMode < 9) && !event.button) {
                    return mouseUp.call(this, event);
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
                // TODO: 是否要传mouseDownEvent
                this.mouseStarted = mouseStart.call(this, event);
                (this.mouseStarted ? mouseDrag.call(this, event) : mouseUp.call(this, event));
            }

            return !this.mouseStarted;
        }

        /**
         * 处理mouseup事件
         * @param {Event} event 事件对象
         *
         * @return {boolean}
         */
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

        /**
         * 鼠标移动距离是否达到指定阈值
         * @param {Event} event 事件对象
         *
         * @return {boolean}
         */
        function mouseDistanceMet(event) {
            return Math.max(
                    Math.abs(this.mouseDownEvent.pageX - event.pageX),
                    Math.abs(this.mouseDownEvent.pageY - event.pageY)
               ) >= this.options.distance;
        }

        /**
         * 鼠标事件触发延时是否是否达到指定阈值
         * @param {Event} event 事件对象
         *
         * @return {boolean}
         */
        function mouseDelayMet() {
            return this.mouseDelayMet;
        }

        /**
         * 捕获事件时触发，返回false则中断后续处理
         * @fires mousecapture
         * @param {Event} event 事件对象
         *
         * @return {boolean}
         */
        function mouseCapture(event) {
            if (u.isFunction(this.options.onMouseCapture)) {
                return this.options.onMouseCapture(event) !== false;
            }
            /**
             * @event mousecapture
             */
            var miniEvent = this.fire('mousecapture', event);
            if (miniEvent.isDefaultPrevented()) {
                return false;
            }
            return true;
        }

        /**
         * 鼠标开始
         * @fires mousestart
         * @param {Event} event 事件对象
         *
         * @return {boolean}
         */
        function mouseStart(event) {
            if (u.isFunction(this.options.onMousestart)) {
                return this.options.onMousestart(event) !== false;
            }
            /**
             * @event mousestart
             */
            var miniEvent = this.fire('mousestart', event);
            return !miniEvent.isDefaultPrevented();
        }

        /**
         * 鼠标移动
         * @fires mousedrag
         * @param {Event} event 事件对象
         */
        function mouseDrag(event) {
            if (u.isFunction(this.options.onMousedrag)) {
                this.options.onMousedrag(event);
                return;
            }
            /**
             * @event mousedrag
             */
            this.fire('mousedrag', event);
        }

        /**
         * 鼠标移动停止
         * @fires mousestop
         * @param {Event} event 事件对象
         */
        function mouseStop(event) {
            if (u.isFunction(this.options.onMousestop)) {
                this.options.onMousestop(event);
                return;
            }
            /**
             * @event mousestop
             */
            this.fire('mousestop', event);
        }

        var Mouse = require('eoo').create(Base, exports);

        Mouse.defaultProperties = {
            // 不触发元素
            cancel: 'input, textarea, button, select, option',
            // 鼠标移动距离阈值，大于该值才触发
            distance: 1,
            // 移动延时
            delay: 0
        };

        require('./bridge')('mouse', Mouse);

        return Mouse;

    }
);
