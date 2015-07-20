/**
 * ESUI (Enterprise Simple UI library)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file DOM相关基础库
 * @author otakustay
 */
define(
    function (require) {
        var $ = require('jquery');

        /**
         * @override lib
         */
        var lib = {};

        /**
         * 从文档中获取指定的DOM元素
         *
         * @param {string | HTMLElement} id 元素的id或DOM元素
         * @return {HTMLElement | null} 获取的元素，查找不到时返回null
         */
        lib.g = function (id) {
            if (!id) {
                return null;
            }

            return typeof id === 'string' ? document.getElementById(id) : id;
        };

        /**
         * 判断一个元素是否输入元素
         *
         * @param {HTMLElement} element 目标元素
         * @return {boolean}
         */
        lib.isInput = function (element) {
            var nodeName = element.nodeName.toLowerCase();
            return nodeName === 'input'
                || nodeName === 'select'
                || nodeName === 'textarea';
        };

        /**
         * 移除目标元素
         *
         * @param {HTMLElement} element 目标元素或其id
         */
        lib.removeNode = function (element) {
            if (typeof element === 'string') {
                element = lib.g(element);
            }

            $(element).remove();
        };

        /**
         * 将目标元素添加到基准元素之后
         *
         * @param {HTMLElement} element 被添加的目标元素
         * @param {HTMLElement} reference 基准元素
         * @return {HTMLElement} 被添加的目标元素
         */
        lib.insertAfter = function (element, reference) {
            $(reference).after(element);
            return element;
        };

        /**
         * 将目标元素添加到基准元素之前
         *
         * @param {HTMLElement} element 被添加的目标元素
         * @param {HTMLElement} reference 基准元素
         * @return {HTMLElement} 被添加的目标元素
         */
        lib.insertBefore = function (element, reference) {
            $(reference).before(element);

            return element;
        };

        /**
         * 获取子元素
         * @param {HTMLElement} element 目标元素
         * @return {HTMLElement[]} 目标元素的所有子元素
         */
        lib.getChildren = function (element) {
            return $(element).children().toArray();
        };

        /**
         * 获取计算样式值
         *
         * @param {HTMLElement} element 目标元素
         * @param {string} key 样式名称
         * @return {string}
         */
        lib.getComputedStyle = function (element, key) {
            if (!element) {
                return '';
            }

            return $(element).css(key);
        };

        /**
         * 获取元素样式值
         *
         * @param {HTMLElement} element 目标元素
         * @param {string} key 样式名称
         * @return {string} 目标元素的指定样式值
         */
        lib.getStyle = function (element, key) {
            key = $.camelCase(key);
            return element.style[key]
                || (element.currentStyle ? element.currentStyle[key] : '')
                || lib.getComputedStyle(element, key);
        };

        /**
         * 获取元素在页面中的位置和尺寸信息
         *
         * @param {HTMLElement} element 目标元素
         * @return {Object} 元素的尺寸和位置信息，
         * 包含`top`、`right`、`bottom`、`left`、`width`和`height`属性
         */
        lib.getOffset = function (element) {
            var rect = element.getBoundingClientRect();
            var offset = {
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                left: rect.left,
                width: rect.right - rect.left,
                height: rect.bottom - rect.top
            };
            var clientTop = document.documentElement.clientTop
                || document.body.clientTop
                || 0;
            var clientLeft = document.documentElement.clientLeft
                || document.body.clientLeft
                || 0;
            var scrollTop = window.pageYOffset
                || document.documentElement.scrollTop;
            var scrollLeft = window.pageXOffset
                || document.documentElement.scrollLeft;
            offset.top = offset.top + scrollTop - clientTop;
            offset.bottom = offset.bottom + scrollTop - clientTop;
            offset.left = offset.left + scrollLeft - clientLeft;
            offset.right = offset.right + scrollLeft - clientLeft;

            return offset;
        };

        /**
         * 获取元素内部文本
         *
         * @param {HTMLElement} element 目标元素
         * @return {string}
         */
        lib.getText = function (element) {
            return $(element).text();
        };

        /**
         * @class lib.dom
         * @singleton
         */
        lib.dom = {};

        /**
         * 获取目标元素的第一个元素节点
         *
         * @param {HTMLElement | string} element 目标元素或其id
         * @return {HTMLElement | null} 目标元素的第一个元素节点，查找不到时返回null
         */
        lib.dom.first = function (element) {
            element = lib.g(element);

            var result = $(element).children(':first-child').get(0);
            return result || null;
        };

        /**
         * 获取目标元素的最后一个元素节点
         *
         * @param {HTMLElement | string} element 目标元素或其id
         * @return {HTMLElement | null} 目标元素的第一个元素节点，查找不到时返回null
         */
        lib.dom.last = function (element) {
            element = lib.g(element);

            var result = $(element).children(':last-child').get(0);
            return result || null;
        };

        /**
         * 获取目标元素的下一个兄弟元素节点
         *
         * @param {HTMLElement | string} element 目标元素或其id
         * @return {HTMLElement | null} 目标元素的下一个元素节点，查找不到时返回null
         */
        lib.dom.next = function (element) {
            element = lib.g(element);

            var result = $(element).next().get(0);
            return result || null;
        };

        /**
         * 获取目标元素的上一个兄弟元素节点
         *
         * @param {HTMLElement | string} element 目标元素或其id
         * @return {HTMLElement | null} 目标元素的上一个元素节点，查找不到时返回null
        */
        lib.dom.previous = function (element) {
            element = lib.g(element);

            var result = $(element).prev().get(0);
            return result || null;
        };

        /**
         * 判断一个元素是否包含另一个元素
         *
         * @param {HTMLElement | string} container 包含元素或元素的 id
         * @param {HTMLElement | string} contained 被包含元素或元素的 id
         * @return {boolean} `contained`元素是否被包含于`container`元素的DOM节点上
         */
        lib.dom.contains = function (container, contained) {
            container = lib.g(container);
            contained = lib.g(contained);

            return $.contains(container, contained);
        };

        return lib;
    }
);
