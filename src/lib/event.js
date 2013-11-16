/**
 * ESUI (Enterprise Simple UI library)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @file DOM事件相关基础库
 * @author otakustay
 */
define(
    function (require) {
        var dom = require('./dom');
        var event = {};

        /**
         * 阻止事件默认行为
         *
         * @param {Event} [event] 事件对象
         */
        event.preventDefault = function (event) {
            event = event || window.event;

            if (event.preventDefault) {
                event.preventDefault();
            }
            else {
                event.returnValue = false;
            }
        };

        /**
         * 阻止事件冒泡
         *
         * @param {Event} [event] 事件对象
         */
        event.stopPropagation = function (event) {
            event = event || window.event;
            
            if (event.stopPropagation) {
                event.stopPropagation();
            }
            else {
                event.cancelBubble = true;
            }
        };

        /**
         * 获取鼠标位置
         *
         * @param {Event} [event] 事件对象
         */
        event.getMousePosition = function (event) {
            event = event || window.event;
            
            var doc = document.documentElement;
            var body = document.body;

            // TODO: 用`page`模块

            if (!event.pageX) {
                event.pageX = event.clientX
                    + (doc && doc.scrollLeft || body && body.scrollLeft || 0)
                    - (doc && doc.clientLeft || body && body.clientLeft || 0);
            }

            if (!event.pageY) {
                event.pageY = event.clientY
                    + (doc && doc.scrollTop || body && body.scrollTop || 0)
                    - (doc && doc.clientTop || body && body.clientTop || 0);
            }
        };

        /**
         * 阻止事件冒泡
         *
         * @param {Event} event 事件对象
         *
         * @return {HTMLElement} 事件目标对象
         */
        event.getTarget = function (event) {
            event = event || window.event;

            return event.target || event.srcElement;
        };

        return {
            on: function (element, type, listener) {
                element = dom.g(element);
                
                if (element.addEventListener) {
                    element.addEventListener(type, listener, false);
                }
                else if (element.attachEvent) {
                    element.attachEvent('on' + type, listener);
                }
            },

            un: function (element, type, listener) {
                element = dom.g(element);
                
                if (element.addEventListener) {
                    element.removeEventListener(type, listener, false);
                }
                else if (element.attachEvent) {
                    element.detachEvent('on' + type, listener);
                }
            },

            event: event
        };
    }
);
