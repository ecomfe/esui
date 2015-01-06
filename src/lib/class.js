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
        var u = require('underscore');
        var dom = require('./dom');

        /**
         * @override lib
         */
        var lib = {};

        function getClassList(element) {
            return element.className
                ? element.className.split(/\s+/)
                : [];
        }

        /**
         * 判断元素是否拥有指定的class
         *
         * @param {HTMLElement | string} element 目标元素或其id
         * @param {string} className 要判断的class名称
         * @return {boolean} 是否拥有指定的class
         */
        lib.hasClass = function (element, className) {
            element = dom.g(element);

            if (className === '') {
                throw new Error('className must not be empty');
            }

            if (!element || !className) {
                return false;
            }

            if (element.classList) {
                return element.classList.contains(className);
            }

            var classes = getClassList(element);
            return u.contains(classes, className);
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

            if (className === '') {
                throw new Error('className must not be empty');
            }

            if (!element || !className) {
                return element;
            }

            if (element.classList) {
                element.classList.add(className);
                return element;
            }

            var classes = getClassList(element);
            if (u.contains(classes, className)) {
                return element;
            }

            classes.push(className);
            element.className = classes.join(' ');

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

            if (!element || !classes) {
                return element;
            }

            if (element.classList) {
                u.each(
                    classes,
                    function (className) {
                        element.classList.add(className);
                    }
                );
                return element;
            }

            var originalClasses = getClassList(element);
            var newClasses = u.union(originalClasses, classes);

            if (newClasses.length > originalClasses.length) {
                element.className = newClasses.join(' ');
            }

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

            if (className === '') {
                throw new Error('className must not be empty');
            }

            if (!element || !className) {
                return element;
            }

            if (element.classList) {
                element.classList.remove(className);
                return element;
            }

            var classes = getClassList(element);
            var changed = false;
            // 这个方法比用`u.diff`要快
            for (var i = 0; i < classes.length; i++) {
                if (classes[i] === className) {
                    classes.splice(i, 1);
                    i--;
                    changed = true;
                }
            }

            if (changed) {
                element.className = classes.join(' ');
            }

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

            if (!element || !classes) {
                return element;
            }

            if (element.classList) {
                u.each(
                    classes,
                    function (className) {
                        element.classList.remove(className);
                    }
                );
                return element;
            }

            var originalClasses = getClassList(element);
            var newClasses = u.difference(originalClasses, classes);

            if (newClasses.length < originalClasses.length) {
                element.className = newClasses.join(' ');
            }

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

            if (className === '') {
                throw new Error('className must not be empty');
            }

            if (!element || !className) {
                return element;
            }

            if (element.classList) {
                element.classList.toggle(className);
                return element;
            }

            var classes = getClassList(element);
            var containsClass = false;
            for (var i = 0; i < classes.length; i++) {
                if (classes[i] === className) {
                    classes.splice(i, 1);
                    containsClass = true;
                    i--;
                }
            }

            if (!containsClass) {
                classes.push(className);
            }
            element.className = classes.join(' ');

            return element;
        };

        return lib;
    }
);
