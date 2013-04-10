/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file Panel控件
 * @author otakustay
 */

define(
    function (require) {
        var Control = require('./Control');

        /**
         * Panel控件
         *
         * @param {Object=} options 初始化参数
         * @constructor
         */
        function Panel(options) {
            Control.apply(this, arguments);
        }

        Panel.prototype.type = 'Panel';

        /**
         * 创建控件主元素
         *
         * @param {Object} 构造函数传入的参数
         * @return {HTMLElement}
         * @override
         * @protected
         */
        Panel.prototype.createMain = function (options) {
            return document.createElement(options.tagName || 'div');
        };

        /**
         * 初始化参数
         *
         * @param {Object=} options 构造函数传入的参数
         * @override
         * @protected
         */
        Panel.prototype.initOptions = function (options) {
            var properties = {};
            var lib = require('./lib');
            lib.extend(properties, options);
            properties.tagName = this.main.nodeName.toLowerCase();
            if (options.content == null) {
                properties.content = this.main.innerHTML;
            }
            lib.extend(this, properties);
        };

        var allProperties = [
            { name: 'content' }
        ];

        /**
         * 渲染自身
         *
         * @param {Array=} 变更过的属性的集合
         * @override
         * @protected
         */
        Panel.prototype.repaint = function (changes) {
            changes = changes || allProperties;
            for (var i = 0; i < changes.length; i++) {
                var record = changes[i];
                if (record.name === 'content') {
                    this.main.innerHTML = this.content;
                }
            }
        };

        /**
         * 设置内容
         *
         * @param {string} html 内容HTML
         */
        Panel.prototype.setContent = function (html) {
            this.setProperties({ content: html });
        };

        require('./lib').inherits(Panel, Control);
        require('./main').register(Panel);
        return Panel;
    }
);
