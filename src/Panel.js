/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file Panel控件
 * @author otakustay
 */
define(
    function (require) {
        var u = require('underscore');
        var lib = require('./lib');
        var Control = require('./Control');

        /**
         * 通用面板
         *
         * 本身没有特别意义，仅作为一个容器存在，方便显示/隐藏等操作
         *
         * 需要特别注意的是，对面板进行`disable()`操作，并不会禁用其内部的控件，
         * 对控件进行批量禁用/启用操作，请使用{@link ViewContext#getGroup}
         * 及{@link ControlCollection}提供的相关方法
         *
         * @extends Control
         * @constructor
         */
        function Panel() {
            Control.apply(this, arguments);
        }

        /**
         * 控件类型，始终为`"Panel"`
         *
         * @type {string}
         * @readonly
         * @override
         */
        Panel.prototype.type = 'Panel';

        /**
         * 获取控件的分类
         *
         * @return {string} 始终返回`"container"`
         * @override
         */
        Panel.prototype.getCategory = function () {
            return 'container';
        };

        /**
         * 创建控件主元素
         *
         * 如果初始化时提供{@link Panel#tagName}属性，则以此创建元素，
         * 默认使用`<div>`元素
         *
         * @param {Object} options 构造函数传入的参数
         * @return {HTMLElement}
         * @protected
         * @override
         */
        Panel.prototype.createMain = function (options) {
            if (!options.tagName) {
                return Control.prototype.createMain.call(this);
            }
            return document.createElement(options.tagName);
        };

        /**
         * 初始化参数
         *
         * 如果初始化时提供了主元素，则使用主元素的标签名作为{@link Panel#tagName}属性
         *
         * @param {Object} [options] 构造函数传入的参数
         * @protected
         * @override
         */
        Panel.prototype.initOptions = function (options) {
            var properties = {};
            u.extend(properties, options);
            /**
             * @property {string} tagName
             *
             * 指定主元素标签名
             *
             * 此属性仅在初始化时生效，运行期不能修改
             *
             * @readonly
             */
            properties.tagName = this.main.nodeName.toLowerCase();
            this.setProperties(properties);
        };

        /**
         * 重渲染
         *
         * @method
         * @protected
         * @override
         */
        Panel.prototype.repaint = require('./painters').createRepaint(
            Control.prototype.repaint,
            {
                /**
                 * @property {string} content
                 *
                 * 面板的内容，为一个HTML片段
                 *
                 * 此属性中可包含ESUI相关的属性，在设置内容后，
                 * 会使用{@link Helper#initChildren}进行内部控件的初始化
                 */
                name: 'content',
                paint: function (panel, content) {
                    // 第一次刷新的时候是可能没有`content`的，
                    // 这时在`innerHTML`上就地创建控件，不要刷掉内容，
                    // 后续有要求`content`是字符串，所以不管非字符串的后果
                    if (content != null) {
                        panel.helper.disposeChildren();
                        panel.main.innerHTML = content;
                    }
                    panel.helper.initChildren();
                }
            }
        );

        /**
         * 设置内容
         *
         * @param {string} html 内容HTML，具体参考{@link Panel#content}属性的说明
         */
        Panel.prototype.setContent = function (html) {
            this.setProperties({ content: html });
        };

        /**
         * 统一化样式名
         *
         * @param {string} name 样式名称
         * @return {string} 统一化后`camelCase`的样式名称
         * @ignore
         */
        function normalizeStyleName(name) {
            if (name.indexOf('-') >= 0) {
                name = name.replace(
                    /-\w/g,
                    function (word) {
                        return word.charAt(1).toUpperCase();
                    }
                );
            }

            return name;
        }

        /**
         * 获取样式，仅获取设置的样式，不包含外部CSS给定的
         *
         * @param {string} name 样式名称
         * @return {string}
         */
        Panel.prototype.getStyle = function (name) {
            name = normalizeStyleName(name);
            return this.main
                ? this.main.style[name]
                : '';
        };

        /**
         * 设置样式
         *
         * @param {string} name 样式名称，如果只有这一个参数，则表示为整串样式
         * @param {string} [value=""] 样式值
         */
        Panel.prototype.setStyle = function (name, value) {
            name = normalizeStyleName(name);
            if (this.main) {
                this.main.style[name] = value || '';
            }
        };

        lib.inherits(Panel, Control);
        require('./main').register(Panel);
        return Panel;
    }
);
