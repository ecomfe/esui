/**
 * ESUI (Enterprise Simple UI library)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file DOM事件相关基础库
 * @author otakustay
 */
define(
    function (require) {
        var dom = require('./dom');
        var page = require('./page').page;

        /**
         * @class lib.event
         * @singleton
         */
        var event = {};


        /**
         * 阻止事件默认行为
         *
         * @param {Event | undefined} event 事件对象
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
         * @param {Event | undefined} event 事件对象
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
         * @param {Event | undefined} event 事件对象
         * @return {Event} 经过修正的事件对象
         */
        event.getMousePosition = function (event) {
            event = event || window.event;

            if (typeof event.pageX !== 'number') {
                event.pageX = 
                    event.clientX + page.getScrollLeft() - page.getClientLeft();
            }

            if (typeof event.pageY !== 'number') {
                event.pageY = 
                    event.clientY + page.getScrollTop() - page.getClientTop();
            }

            return event;
        };

        /**
         * 阻止事件冒泡
         *
         * @param {Event | undefined} event 事件对象
         * @return {HTMLElement} 事件目标对象
         */
        event.getTarget = function (event) {
            event = event || window.event;

            return event.target || event.srcElement;
        };

        
        /**
         * @override lib
         */
        return {
            /**
             * 为DOM元素添加事件
             *
             * 本方法 *不处理* DOM事件的兼容性，包括执行顺序、`Event`对象属性的修正等
             *
             * @param {HTMLElement | string} element DOM元素或其id
             * @param {string} type 事件类型， *不能* 带有`on`前缀
             * @param {Function} listener 事件处理函数
             */
            on: function (element, type, listener) {
                element = dom.g(element);

                if (element.addEventListener) {
                    element.addEventListener(type, listener, false);
                }
                else if (element.attachEvent) {
                    element.attachEvent('on' + type, listener);
                }
            },

            /**
             * 为DOM元素移除事件
             *
             * 本方法 *不处理* DOM事件的兼容性，包括执行顺序、`Event`对象属性的修正等
             *
             * @param {HTMLElement | string} element DOM元素或其id
             * @param {string} type 事件类型， *不能* 带有`on`前缀
             * @param {Function} listener 事件处理函数
             */
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
