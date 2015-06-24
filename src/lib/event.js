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
        var $ = require('jquery');

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
                $(element).bind(type, listener);
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
                $(element).unbind(type, listener);
            }
        };
    }
);
