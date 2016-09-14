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
         * @param {boolean} [connected = false] 生成的控件是否由当前控件作为owner
         * @return {Array} 子控件数组
         */
        helper.initChildren = function (wrap, options, connected) {
            wrap = wrap || this.control.main;

            var control = this.control;
            var rawValueReplacer = control.renderOptions && control.renderOptions.valueReplacer;
            var source = connected ? control : control.owner;
            var valueReplacer = function (value) {
                if (value.charAt(0) === '@') {
                    var path = value.substring(1).split('.');
                    var propertyName = path.shift();
                    var result = u.reduce(
                        path,
                        function (value, property) {
                            return value[property];
                        },
                        source.get(propertyName)
                    );
                    return result;
                }
                return rawValueReplacer ? rawValueReplacer(value) : value;
            };
            options = u.extend({valueReplacer: source ? valueReplacer : rawValueReplacer, owner: source}, options);
            options.viewContext = this.control.viewContext;
            options.parent = this.control;

            var event = this.control.fire('initchildren', {options: options});

            return ui.init(wrap, event.options);
        };

        /**
         * 批量初始化自有子控件
         *
         * 该方法与`intiChildren`的不同在于，会使用一个特殊的`valueReplacer`，
         * 在子控件的HTML中的`foo="@bar.x.y"`会等效于父控件的`get('bar').x.x`
         *
         * @param {HTMLElement} [wrap] 容器DOM元素，默认为主元素
         * @param {Object} [options] init参数
         * @param {Object} [options.properties] 属性集合，通过id映射
         * @return {Array} 子控件数组
         */
        helper.initConnectedChildren = function (wrap, options) {
            return this.initChildren(wrap, options, true);
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
            this.control.children = [];
            this.control.childrenIndex = {};
        };

        /**
         * 禁用全部子控件
         */
        helper.disableChildren = function () {
            u.each(
                this.control.children,
                function (child) {
                    child.disable();
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
