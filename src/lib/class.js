/**
 * ESUI (Enterprise Simple UI library)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file DOM class基础库
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

        lib.getClassList = function (element) {
            return element.className
                ? element.className.split(/\s+/)
                : [];
        };

        /**
         * 判断元素是否拥有指定的class
         *
         * @param {HTMLElement | string} element 目标元素或其id
         * @param {string} className 要判断的class名称
         * @return {boolean} 是否拥有指定的class
         */
        lib.hasClass = function (element, className) {
            element = dom.g(element);

            return $(element).hasClass(className);
        };

        /**
         * 为目标元素添加class
         *
         * @param {HTMLElement | string} element 目标元素或其id
         * @param {string} className 要添加的class名称
         * @return {HTMLElement} 目标元素
         */
        lib.addClass = function (element, className) {
            element = dom.g(element);

            $(element).addClass(className);
            return element;
        };

        /**
         * 批量添加class
         *
         * @param {HTMLElement | string} element 目标元素或其id
         * @param {string[]} classes 需添加的class名称
         * @return {HTMLElement} 目标元素
         */
        lib.addClasses = function (element, classes) {
            element = dom.g(element);

            $(element).addClass(classes.join(' '));
            return element;
        };

        /**
         * 移除目标元素的class
         *
         * @param {HTMLElement | string} element 目标元素或目标元素的 id
         * @param {string} className 要移除的class名称
         * @return {HTMLElement} 目标元素
         */
        lib.removeClass = function (element, className) {
            element = dom.g(element);

            $(element).removeClass(className);
            return element;
        };

        /**
         * 批量移除class
         *
         * @param {HTMLElement | string} element 目标元素或其id
         * @param {string[]} classes 需移除的class名称
         * @return {HTMLElement} 目标元素
         */
        lib.removeClasses = function (element, classes) {
            element = dom.g(element);

            $(element).removeClass(classes.join(' '));
            return element;
        };

        /**
         * 切换目标元素的class
         *
         * @param {HTMLElement} element 目标元素或目标元素的 id
         * @param {string} className 要切换的class名称
         * @return {HTMLElement} 目标元素
         */
        lib.toggleClass = function (element, className) {
            element = dom.g(element);

            $(element).toggleClass(className);
            return element;
        };

        return lib;
    }
);
