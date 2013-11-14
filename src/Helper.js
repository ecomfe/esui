/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 控件类常用的方法辅助类
 * @author otakustay
 */

define(
    function (require) {
        var lib = require('./lib');
        var controlHelper = require('./controlHelper');
        var u = require('underscore');

        function Helper(control) {
            this.control = control;
        }

        /**
         * 获取控件部件相关的class数组
         *
         * @param {string=} part 部件名称
         * @return {string[]}
         */
        Helper.prototype.getPartClasses = function (part) {
            return controlHelper.getPartClasses(this.control, part);
        };

        /**
         * 获取控件部件相关的class字符串
         *
         * @param {string=} part 部件名称
         * @return {string}
         */
        Helper.prototype.getPartClassName = function (part) {
            return this.getPartClasses(part).join(' ');
        };

        /**
         * 添加部件class
         *
         * @param {string} part 部件名称
         * @param {HTMLElement|string} element 部件元素或部件名称
         */
        Helper.prototype.addPartClasses = function (part, element) {
            if (typeof element === 'string') {
                element = this.getPart(element);
            }

            controlHelper.addPartClasses(this.control, part, element);
        };

        /**
         * 移除部件class
         *
         * @param {string} part 部件名称
         * @param {HTMLElement|string} element 部件元素或部件名称
         */
        Helper.prototype.removePartClasses = function (part, element) {
            if (typeof element === 'string') {
                element = this.getPart(element);
            }

            controlHelper.removePartClasses(this.control, part, element);
        };

        /**
         * 获取用于控件DOM元素的id
         * 
         * @param {string=} part 部件名称
         * @return {string} 
         */
        Helper.prototype.getId = function (part) {
            return controlHelper.getId(this.control, part);
        };

        /**
         * 获取指定部件的DOM元素
         *
         * @param {string} part 部件名称
         * @return {HTMLElement}
         */
        Helper.prototype.getPart = function (part) {
            return lib.g(this.getId(part));
        };

        /**
         * 判断DOM元素是否某一部件
         *
         * @param {HTMLElement} element DOM元素
         * @param {string} part 部件名称
         * @return {boolean}
         */
        Helper.prototype.isPart = function (element, part) {
            var className = this.getPartClasses(part)[0];
            return lib.hasClass(element, className);
        };

        /**
         * 获取部件的起始标签
         *
         * @param {string} part 部件名称
         * @param {string} nodeName 部件使用的元素类型
         * @return {string}
         */
        Helper.prototype.getPartBeginTag = function (part, nodeName) {
            var html = '<' + nodeName + ' id="' + this.getId(part) + '" '
                + 'class="' + this.getPartClassName(part) + '">';
            return html;
        };

        /**
         * 获取部件的结束标签
         *
         * @param {string} part 部件名称
         * @param {string} nodeName 部件使用的元素类型
         * @return {string}
         */
        Helper.prototype.getPartEndTag = function (part, nodeName) {
            var html = '</' + nodeName + '>';
            return html;
        };

        /**
         * 获取部件的HTML模板
         *
         * @param {string} part 部件名称
         * @param {string} nodeName 部件使用的元素类型
         * @return {string}
         */
        Helper.prototype.getPartHTML = function (part, nodeName) {
            return this.getPartBeginTag(part, nodeName)
                + this.getPartEndTag(part, nodeName);
        };

        /**
         * 为控件管理的DOM元素添加DOM事件
         *
         * @param {HTMLElement|string} element 需要添加事件的DOM元素或部件名称
         * @param {string} type 事件的类型
         * @param {function} handler 事件处理函数
         */
        Helper.prototype.addDOMEvent = function (element, type, handler) {
            if (typeof element === 'string') {
                element = this.getPart(element);
            }

            controlHelper.addDOMEvent(this.control, element, type, handler);
        };

        /**
         * 为控件管理的DOM元素移除DOM事件
         *
         * @param {HTMLElement|string} element 需要添加事件的DOM元素或部件名称
         * @param {string} type 事件的类型
         * @param {function} handler 事件处理函数
         */
        Helper.prototype.removeDOMEvent = function (element, type, handler) {
            if (typeof element === 'string') {
                element = this.getPart(element);
            }

            controlHelper.removeDOMEvent(this.control, element, type, handler);
        };

        // 输入元素的属性映射关系
        var INPUT_ATTRIBUTES = {
            name: 'name', value: 'value',
            autofocus: 'autoFocus',
            disabled: 'disabled', readonly: 'readOnly',
            inputmode: 'inputMode',
            max: 'max', min: 'min',
            maxlength: 'maxLength', minlength: 'minLength',
            required: 'required', pattern: 'pattern'
        };

        /**
         * 收集`<input>`元素上的属性
         *
         * @param {HTMLElement} input DOM元素
         * @return {Object}
         */
        Helper.prototype.collectInputAttributes = function (input) {
            var properties = {};

            u.each(
                INPUT_ATTRIBUTES,
                function (propertyName, attributeName) {
                    var attribute = lib.getAttributeNode(input, attributeName);
                    if (attribute.specified) {
                        properties[propertyName] = attribute.value;
                    }
                }
            );

            return properties;
        };

        return Helper;
    }
);
