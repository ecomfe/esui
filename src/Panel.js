/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file Panel控件
 * @author otakustay
 */
define(
    function (require) {
        var lib = require('./lib');
        var Control = require('./Control');

        /**
         * Panel控件
         *
         * @constructor
         * @extends Control
         */
        function Panel() {
            Control.apply(this, arguments);
        }

        Panel.prototype.type = 'Panel';

        /**
         * 创建控件主元素
         *
         * @param {Object} 构造函数传入的参数
         * @return {HTMLElement}
         * @protected
         * @override
         */
        Panel.prototype.createMain = function (options) {
            return document.createElement(options.tagName || 'div');
        };

        Panel.prototype.initOptions = function (options) {
            var properties = {};
            lib.extend(properties, options);
            properties.tagName = this.main.nodeName.toLowerCase();
            this.setProperties(properties);
        };

        /**
         * 渲染自身
         *
         * @protected
         * @override
         */
        Panel.prototype.repaint = require('./painters').createRepaint(
            Control.prototype.repaint,
            {
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
         * @param {string} html 内容HTML
         */
        Panel.prototype.setContent = function (html) {
            this.setProperties({ content: html });
        };

        /**
         * 统一化样式名
         *
         * @param {string} name 样式名称
         * @return {string} 统一化后camelCase的样式名称
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
         * @param {string} [value] 样式值
         */
        Panel.prototype.setStyle = function (name, value) {
            name = normalizeStyleName(name);
            if (this.main) {
                this.main.style[name] = value;
            }
        };

        lib.inherits(Panel, Control);
        require('./main').register(Panel);
        return Panel;
    }
);
