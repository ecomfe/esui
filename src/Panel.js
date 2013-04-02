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
         * 初始化参数
         *
         * @param {Object=} options 构造函数传入的参数
         * @override
         * @protected
         */
        Panel.prototype.initOptions = function (options) {
            var defaults = {
                tagName: 'div'
            };
            var lib = require('./lib');
            options = lib.extend(defaults, options);
            if (options.main) {
                options.tagName = options.main.nodeName.toLowerCase();
                if (options.content == null) {
                    options.content = options.main.innerHTML;
                }
            }
            this.setProperties(options);
        };

        /**
         * 创建控件主元素
         *
         * @return {HTMLElement}
         * @override
         * @protected
         */
        Panel.prototype.createMain = function () {
            return document.createElement(this.tagName);
        };

        /**
         * 渲染自身
         *
         * @param {Array=} 变更过的属性的集合
         * @override
         * @protected
         */
        Panel.prototype.repaint = function (changes) {
            // Panel也只有`content`是可以设置的，
            // 如果设置其它属性导致这里出错不负责任了
            if (changes && changes.length) {
                this.main.innerHTML = this.content;
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
