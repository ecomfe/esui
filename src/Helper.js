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

        return Helper;
    }
);
