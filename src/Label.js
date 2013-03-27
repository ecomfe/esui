/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file Label控件
 * @author erik, otakustay
 */

define(
    function (require) {
        var Control = require('./Control');
        var helper = require('./controlHelper');

        /**
         * Label的默认选项
         *
         * @type {Object}
         * @inner
         * @const
         */
        var DEFAULT_OPTION = {
            tagName: 'span'
        };

        /**
         * Label控件
         *
         * @param {Object=} options 初始化参数
         * @constructor
         */
        function Label(options) {
            helper.init(this, options, DEFAULT_OPTION);
            if (this.main) {
                this.tagName = this.main.nodeName.toLowerCase();
            }
            helper.afterInit(this);
        }

        Label.prototype.type = 'Label';

        /**
         * 创建控件主元素
         *
         * @override
         * @return {HTMLElement}
         */
        Label.prototype.createMain = function () {
            return document.createElement(this.tagName);
        };

        /**
         * 设置文本
         *
         * @param {string} text 文本内容
         */
        Label.prototype.setText = function (text) {
            if (!this.main) {
                return;
            }

            this.disposeChildren();
            this.main.innerHTML = require('./lib').encodeHTML(text);
        };

        /**
         * 设置内容
         *
         * @param {string} html 内容HTML
         */
        Label.prototype.setContent = function (html) {
            if (!this.main) {
                return;
            }

            this.disposeChildren();
            this.main.innerHTML = html;
            this.initChildren(this.main);
        };

        /**
         * 获取文本
         *
         * @return {string}
         */
        Label.prototype.getText = function () {
            return this.main ? this.main.innerText : '';
        }

        require('./lib').inherits(Label, Control);
        require('./main').register(Label);
        return Label;
    }
);
