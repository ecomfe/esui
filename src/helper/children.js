/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 子控件相关辅助方法
 * @author otakustay
 */
define(
    function (require) {
        var u = require('underscore');
        var ui = require('../main');

        /**
         * @override Helper
         */
        var helper = {};

        /**
         * 批量初始化子控件
         * 
         * @param {HTMLElement} [wrap] 容器DOM元素，默认为主元素
         * @param {Object} [options] init参数
         * @param {Object} [options.properties] 属性集合，通过id映射
         */
        helper.initChildren = function (wrap, options) {
            wrap = wrap || this.control.main;
            options = u.extend({}, this.control.renderOptions, options);
            options.viewContext = this.control.viewContext;
            options.parent = this.control;

            ui.init(wrap, options);
        };

        /**
         * 销毁所有子控件
         */
        helper.disposeChildren = function () {
            var children = this.control.children.slice();
            u.each(
                children,
                function (child) {
                    child.dispose();
                }
            );
            this.children = [];
            this.childrenIndex = {};
        };

        /**
         * 禁用全部子控件
         */
        helper.disableChildren = function () {
            u.each(
                this.control.children,
                function (child) {
                    child.dispose();
                }
            );
        };

        /**
         * 启用全部子控件
         */
        helper.enableChildren = function () {
            u.each(
                this.control.children,
                function (child) {
                    child.enable();
                }
            );
        };

        return helper;
    }
);
