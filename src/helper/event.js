/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file DOM事件相关辅助方法
 * @author otakustay
 */
define(
    function (require) {
        var $ = require('jquery');
        var u = require('underscore');

        var Event = require('../lib').interopDefault(require('mini-event/Event'));

        /**
         * @override Helper
         */
        var helper = {};

        function formatEventType(types, namespace) {
            var formatString = function (strTypes) {
                var arrTypes = strTypes.split(' ');
                arrTypes = u.map(arrTypes, function (t) {
                    if (/\./.test(t)) {
                        return t;
                    }

                    return t + '.' + namespace;
                });
                return arrTypes.join(' ');
            };

            if (typeof types === 'string') {
                return formatString(types);
            }
            if (typeof types === 'object') {
                u.map(types, function (t) {
                    var objType = {};
                    objType[formatString(t)] = types[t];
                    return objType;
                });
                return types;
            }
        }

        function addEvent(option, element, type, selector, data, handler) {
            var me = this;
            var ctrl = me.control;

            if (typeof element === 'string') {
                element = me.getPart(element);
            }

            // 适配参数
            if (data == null && handler == null) {
                handler = selector;
                data = selector = undefined;
            }
            else if (handler == null) {
                if (typeof selector === 'string') {
                    handler = data;
                    data = undefined;
                }
                else {
                    handler = data;
                    data = selector;
                    selector = undefined;
                }
            }

            var $element = $(element);
            ctrl.domEvents.push($element);

            function handlerProxy() {
                if (!option.sikpStateCheck
                    && u.any(
                        ctrl.ignoreStates,
                        function (state) {
                            return ctrl.hasState(state);
                        }
                    )
                ) {
                    return;
                }
                return (typeof handler === 'string' ? ctrl[handler] : handler)
                    .apply(ctrl, arguments);
            }
            // 绑定事件，并未其添加type命名空间。
            var types = formatEventType(type, ctrl.getUniqueId());
            if (option.once) {
                $element.one(types, selector, data, handlerProxy);
            }
            else {
                // 方便移除绑定的事件, JQ中通过guid来匹配解除function
                if (typeof handler !== 'string') {
                    handlerProxy.guid = handler.guid
                        = (handler.guid || handlerProxy.guid || $.guid++);
                }
                $element.on(types, selector, data, handlerProxy);
            }
        }

        function fromDOMEvent(domEvent, type, args) {
            domEvent = domEvent || window.event;

            var event = new Event(type, args);

            event.preventDefault = function () {
                if (domEvent.preventDefault) {
                    domEvent.preventDefault();
                }
                else {
                    domEvent.returnValue = false;
                }

                Event.prototype.preventDefault.call(this);
            };

            event.stopPropagation = function () {
                if (domEvent.stopPropagation) {
                    domEvent.stopPropagation();
                }
                else {
                    domEvent.cancelBubble = true;
                }

                Event.prototype.stopPropagation.call(this);
            };

            event.stopImmediatePropagation = function () {
                if (domEvent.stopImmediatePropagation) {
                    domEvent.stopImmediatePropagation();
                }

                Event.prototype.stopImmediatePropagation.call(this);
            };

            return event;
        }

        /**
         * 为控件管理的DOM元素添加DOM事件
         *
         * 通过本方法添加的DOM事件处理函数，会进行以下额外的处理：
         * - 函数中的`this`对象永远指向当前控件实例
         * - 当控件处于由其{@link Control#ignoreStates}属性定义的状态时，不执行函数
         *
         * @param {Object=} options 其他事件参数, skipStateCheck, once
         * @param {HTMLElement | string} element 需要添加事件的DOM元素或部件名称
         * @param {string} type 事件的类型
         * @param {string} selector 触发事件的selector
         * @param {Object=} data 事件处理函数
         * @param {Function} handler 事件处理函数
         */
        helper.addDOMEvent = function (options, element, type, selector, data, handler) {
            if ($.isPlainObject(options)) {
                addEvent.call(this, options, element, type, selector, data, handler);
            }
            else {
                addEvent.call(this, {}, options, element, type, selector, data);
            }
        };

        /**
         * 代理DOM元素的事件为自身的事件
         *
         * @param {HTMLElement | string} element 需要添加事件的DOM元素或部件名称
         * @param {string} type 需要代理的DOM事件类型
         * @param {string} [newType] 代理时触发的事件，默认与`type`一致
         */
        helper.delegateDOMEvent = function (element, type, newType) {
            var handler = function (e) {
                var event = fromDOMEvent(e);
                this.fire(newType || e.type, event);

                if (event.isDefaultPrevented()) {
                    e.preventDefault();
                }

                if (event.isPropagationStopped()) {
                    e.stopPropagation();
                }
            };

            this.addDOMEvent(element, type, handler);
        };

        /**
         * 为控件管理的DOM元素移除DOM事件
         *
         * @param {HTMLElement | string} element 需要添加事件的DOM元素或部件名称
         * @param {string} type 事件的类型
         * @param {string=} selector selector
         * @param {Function} handler 事件处理函数，不提供则清除所有处理函数
         */
        helper.removeDOMEvent = function (element, type, selector, handler) {
            if (typeof element === 'string') {
                element = this.getPart(element);
            }
            if (!(typeof selector === 'string')) {
                handler = selector;
                selector = undefined;
            }
            var $element = $(element);
            $element.off(type, selector, handler);
        };

        /**
         * 通过选择器添加事件
         *
         * 该事件会被添加在`main`元素上，使用选择器判断`event.target`确定是否执行对应的处理函数，
         * 因此如果需要在`layer`等与`main`元素不关联的元素上添加事件，不可使用此方法
         *
         * @protected
         * @param {string} event 事件名称
         * @param {string} selector 选择器，会使用`buildSelector`进行翻译
         * @param {Function} handler 处理函数
         */
        helper.addEventForSelector = function (event, selector, handler) {
            var parsedSelector = this.buildSelector(selector);
            this.addDOMEvent(this.control.main, event, parsedSelector, handler);
        };

        /**
         * 通过选择器移除事件，与`addEventForSelector`方法对应
         *
         * @protected
         * @param {string} event 事件名称
         * @param {string} selector 选择器，会使用`buildSelector`进行翻译
         * @param {Function} handler 处理函数
         */
        helper.removeEventForSelector = function (event, selector, handler) {
            var parsedSelector = this.buildSelector(selector);
            this.removeDOMEvent(this.control.main, event, parsedSelector, handler);
        };

        return helper;
    }
);
