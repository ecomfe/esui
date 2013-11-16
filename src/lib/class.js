/**
 * ESUI (Enterprise Simple UI library)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @file DOM class基础库
 * @author otakustay
 */
define(
    function (require) {
        var lib = {};

        /**
         * 判断元素是否拥有指定的 className
         *
         * @param {HTMLElement} element 目标元素
         * @param {string} className 要判断的className
         *
         * @return {boolean} 是否拥有指定的className
         */
        lib.hasClass = function (element, className) {
            if (!element) {
                return false;
            }

            if (!className) {
                return true;
            }

            var classes = element.className.split(/\s+/);
            for (var i = 0; i < classes.length; i++) {
                if (classes[i] === className) {
                    return true;
                }
            }

            return false;
        };

        /**
         * 为目标元素添加 className
         *
         * @param {HTMLElement} element 目标元素或目标元素的 id
         * @param {string} className 要添加的 className
         *
         * @return {HTMLElement} 目标元素
         */
        lib.addClass = function (element, className) {
            if (!element || !className) {
                return element;
            }

            var classes = element.className
                ? element.className.split(/\s+/)
                : [];
            for (var i = 0; i < classes.length; i++) {
                if (classes[i] === className) {
                    return element;
                }
            }

            classes.push(className);
            element.className = classes.join(' ');

            return element;
        };

        /**
         * 批量添加 className
         *
         * @param {HTMLElement} element 目标元素
         * @param {Array.<string>} classes 需添加的 className
         *
         * @return {HTMLElement} 目标元素
         */
        lib.addClasses = function (element, classes) {
            if (!element || !classes) {
                return element;
            }

            var originalClasses =
                element.className ? element.className.split(/\s+/) : [];
            var map = {};
            for (var i = 0; i < originalClasses.length; i++) {
                map[originalClasses[i]] = true;
            }

            var changed = false;
            for (var i = 0; i < classes.length; i++) {
                var className = classes[i];
                if (!map.hasOwnProperty(className)) {
                    originalClasses.push(className);
                    changed = true;
                }
            }

            if (changed) {
                element.className = originalClasses.join(' ');
            }

            return element;
        };

        /**
         * 移除目标元素的 className
         *
         * @param {HTMLElement} element 目标元素或目标元素的 id
         * @param {string} className 要移除的 className
         *
         * @return {HTMLElement} 目标元素
         */
        lib.removeClass = function (element, className) {
            if (!element || !className) {
                return element;
            }

            var classes = element.className
                ? element.className.split(/\s+/)
                : [];
            for (var i = 0; i < classes.length; i++) {
                if (classes[i] === className) {
                    classes.splice(i, 1);
                    i--;
                }
            }
            element.className = classes.join(' ');

            return element;
        };

        /**
         * 批量移除 className
         *
         * @param {HTMLElement} element 目标元素
         * @param {Array.<string>} 需移除的 className
         *
         * @return {HTMLElement} 目标元素
         */
        lib.removeClasses = function (element, classes) {
            if (!element || !classes) {
                return element;
            }

            var map = {};
            for (var i = 0; i < classes.length; i++) {
                map[classes[i]] = true;
            }

            var originalClasses =
                element.className ? element.className.split(/\s+/) : [];
            var finalClasses = [];
            for (var i = 0; i < originalClasses.length; i++) {
                var className = originalClasses[i];
                if (!map.hasOwnProperty(className)) {
                    finalClasses.push(className);
                }
            }

            if (finalClasses.length !== originalClasses.length) {
                element.className = finalClasses.join(' ');
            }

            return element;
        };

        /**
         * 切换目标元素的 className
         *
         * @param {HTMLElement} element 目标元素或目标元素的 id
         * @param {string} className 要切换的 className
         *
         * @return {HTMLElement} 目标元素
         */
        lib.toggleClass = function (element, className) {
            if (!element || !className) {
                return element;
            }

            var classes = element.className
                ? element.className.split(/\s+/)
                : [];
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
