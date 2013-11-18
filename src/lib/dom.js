/**
 * ESUI (Enterprise Simple UI library)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @file DOM相关基础库
 * @author otakustay
 */
define(
    function (require) {
        var u = require('underscore');
        var string = require('./string');
        var lib = {};

        /**
         * 从文档中获取指定的 DOM 元素
         *
         * @param {string|HTMLElement} id 元素的 id 或 DOM 元素
         *
         * @return {?HTMLElement} 获取的元素，查找不到时返回null
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
         *
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
         * @param {HTMLElement} element 目标元素或目标元素的 id
         *
         */
        lib.removeNode = function (element) {
            if (typeof element === 'string') {
                element = lib.g(element);
            }

            if (!element) {
                return;
            }

            var parent = element.parentNode;
            if (parent) {
                parent.removeChild(element);
            }
        };

        /**
         * 将目标元素添加到基准元素之后
         *
         * @param {HTMLElement} newElement 被添加的目标元素
         * @param {HTMLElement} existElement 基准元素
         *
         * @return {HTMLElement} 被添加的目标元素
         */
        lib.insertAfter = function (newElement, existElement) {
            var parent = existElement.parentNode;

            if (parent) {
                parent.insertBefore(newElement, existElement.nextSibling);
            }
            return newElement;
        };

        /**
         * 将目标元素添加到基准元素之前
         *
         * @param {HTMLElement} newElement 被添加的目标元素
         * @param {HTMLElement} existElement 基准元素
         *
         * @return {HTMLElement} 被添加的目标元素
         */
        lib.insertBefore = function (newElement, existElement) {
            var parent = existElement.parentNode;

            if (parent) {
                parent.insertBefore(newElement, existElement);
            }

            return newElement;
        };

        /**
         * 获取子元素
         * @param {HTMLElement} element 目标元素
         * @param {Array.<HTMLElement>} 目标元素的所有子元素
         */
        lib.getChildren = function (element) {
            return u.filter(
                element.children,
                function (child) {
                    return child.nodeType === 1;
                }
            );
        };


        /**
         * 获取计算样式值
         *
         * @param {HTMLElement} element 目标元素
         * @param {string} key 样式名称
         *
         * @return {string}
         */
        lib.getComputedStyle = function (element, key) {
            if (!element) {
                return '';
            }

            var doc = element.nodeType == 9
                ? element
                : element.ownerDocument || element.document;

            if (doc.defaultView && doc.defaultView.getComputedStyle) {
                var styles = doc.defaultView.getComputedStyle(element, null);
                if (styles) {
                    return styles[key] || styles.getPropertyValue(key);
                }
            }
            else if (element && element.currentStyle) {
                return element.currentStyle[key];
            }
            return '';
        };

        /**
         * 获取元素样式值
         *
         * @param {HTMLElement} element 目标元素
         * @param {string} key 样式名称
         *
         * @return {string} 目标元素的指定样式值
         */
        lib.getStyle = function (element, key) {
            key = string.camelize(key);
            return element.style[key]
                || (element.currentStyle ? element.currentStyle[key] : '')
                || lib.getComputedStyle(element, key);
        };

        /**
         * 获取元素在页面中的位置和尺寸信息
         *
         * @param {HTMLElement} element 目标元素
         *
         * @return {Object} 元素的尺寸和位置信息
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

        lib.getText = function (element) {
            var ret = '';
            var childs;
            var i = 0;
            var l;

            //  text 和 CDATA 节点，取nodeValue
            if (element.nodeType === 3 || element.nodeType === 4) {

                ret += element.nodeValue;
            }
            // 8 是 comment Node
            else if (element.nodeType !== 8) {
                childs = element.childNodes;

                for (l = childs.length; i < l; i++) {
                    ret += lib.getText(childs[i]);
                }
            }

            return ret;
        };

        lib.dom = {};

        /**
         * 获取目标元素的第一个元素节点
         *
         * @method module:lib.dom.first
         * @grammar lib.dom.first(element)
         * @param {(HTMLElement | string)} element 目标元素或目标元素的 id
         * @meta standard
         *
         * @return {?HTMLElement} 目标元素的第一个元素节点，查找不到时返回 null
         */
        lib.dom.first = function (element) {
            element = lib.g(element);

            var node = element['firstChild'];
            for (; node; node = node['nextSibling']) {
                if (node.nodeType == 1) {
                    return node;
                }
            }

            return null;
        };

        /**
         * 获取目标元素的最后一个元素节点
         *
         * @method module:lib.dom.last
         * @grammar lib.dom.last(element)
         * @param {(HTMLElement | string)} element 目标元素或目标元素的 id
         * @meta standard
         *
         * @return {?HTMLElement} 目标元素的第一个元素节点，查找不到时返回 null
         */
        lib.dom.last = function (element) {
            element = lib.g(element);
            if (element.lastElementChild) {
                return element.lastElementChild;
            }

            var node = element.lastChild;
            for (; node; node = node.previousSibling) {
                if (node.nodeType === 1) {
                    return node;
                }
            }

            return null;
        };

        /**
         * 获取目标元素的下一个兄弟元素节点
         *
         * @method module:lib.dom.next
         * @grammar lib.dom.next(element)
         * @param {(HTMLElement | string)} element 目标元素或目标元素的 id
         * @meta standard
         *
         * @return {?HTMLElement} 目标元素的下一个兄弟元素节点，查找不到时返回 null
         */
        lib.dom.next = function (element) {
            element = lib.g(element);

            var node = element['nextSibling'];
            for (; node; node = node['nextSibling']) {
                if (node.nodeType == 1) {
                    return node;
                }
            }

            return null;
        };

        /**
         * 判断一个元素是否包含另一个元素
         *
         * @method  module:lib.dom.contains
         * @grammar lib.dom.contains(container, contained)
         * @param {(HTMLElement | string)} container 包含元素或元素的 id
         * @param {(HTMLElement | string)} contained 被包含元素或元素的 id
         * @meta standard
         *
         * @return {boolean} contained 元素是否被包含于 container 元素的 DOM 节点上
         */
        lib.dom.contains = function (container, contained) {
            container = lib.g(container);
            contained = lib.g(contained);

            //fixme: 无法处理文本节点的情况(IE)
            return container.contains
                ? container != contained && container.contains(contained)
                : !!(container.compareDocumentPosition(contained) & 16);
        };

        return lib;
    }
);