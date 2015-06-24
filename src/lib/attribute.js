/**
 * ESUI (Enterprise Simple UI library)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file DOM属性相关基础库
 * @author otakustay
 */

define(
    function (require) {
        var dom = require('./dom');
        var $ = require('jquery');

        /**
         * @override lib
         */
        var lib = {};

        /**
         * 检查元素是否有指定的属性
         *
         * @param {HTMLElement} element 指定元素
         * @param {string} name 指定属性名称
         * @return {boolean}
         */
        lib.hasAttribute = function (element, name) {
            if (element.hasAttribute) {
                return element.hasAttribute(name);
            }
            return element.attributes
                && element.attributes[name]
                && element.attributes[name].specified;
        };

        /**
         * 设置元素属性，会对某些值做转换
         *
         * @param {HTMLElement | string} element 目标元素或其id
         * @param {string} key 要设置的属性名
         * @param {string} value 要设置的属性值
         * @return {HTMLElement} 目标元素
         */
        lib.setAttribute = function (element, key, value) {
            element = dom.g(element);

            $(element).attr(key, value);

            return element;
        };

        /**
         * 获取目标元素的属性值
         *
         * @param {HTMLElement | string} element 目标元素或其id
         * @param {string} key 要获取的属性名称
         * @return {string | null} 目标元素的attribute值，获取不到时返回 null
         */
        lib.getAttribute = function (element, key) {
            element = dom.g(element);

            return $(element).attr(key);
        };

        /**
         * 移除元素属性
         *
         * @param {HTMLElement | string} element 目标元素或其id
         * @param {string} key 属性名称
         */
        lib.removeAttribute = function (element, key) {
            element = dom.g(element);

            $(element).removeAttr(key);
        };

        return lib;
    }
);
