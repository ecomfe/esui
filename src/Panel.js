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
        var helper = require('./controlHelper');

        /**
         * Panel的默认选项
         *
         * @type {Object}
         * @inner
         * @const
         */
        var DEFAULT_OPTION = {
            tagName: 'div'
        };

        /**
         * Panel控件
         *
         * @param {Object=} options 初始化参数
         * @constructor
         */
        function Panel(options) {
            helper.init(this, options, DEFAULT_OPTION);
            if (this.main) {
                this.tagName = this.main.nodeName.toLowerCase();
            }
            helper.afterInit(this);
        }

        Panel.prototype.type = 'Panel';

        /**
         * 创建控件主元素
         *
         * @override
         * @return {HTMLElement}
         */
        Panel.prototype.createMain = function () {
            return document.createElement(this.tagName);
        };

        /**
         * 设置内容
         *
         * @param {string} html 内容HTML
         */
        Panel.prototype.setContent = function (html) {
            this.disposeChildren();
            this.main.innerHTML = html;
            this.initChildren(this.main);
        };

        require('./lib').inherits(Panel, Control);
        require('./main').register(Panel);
        return Panel;
    }
);
