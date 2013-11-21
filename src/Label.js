/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file Label控件
 * @author erik, otakustay
 */
define(
    function (require) {
        var lib = require('./lib');
        var Control = require('./Control');

        /**
         * Label控件
         *
         * @param {Object=} options 初始化参数
         * @constructor
         */
        function Label(options) {
            Control.apply(this, arguments);
        }

        Label.prototype.type = 'Label';

        /**
         * 创建控件主元素
         *
         * @param {Object} 构造函数传入的参数
         * @return {HTMLElement}
         * @override
         * @protected
         */
        Label.prototype.createMain = function (options) {
            return document.createElement(options.tagName || 'span');
        };

        /**
         * 初始化参数
         *
         * @param {Object=} options 构造函数传入的参数
         * @override
         * @protected
         */
        Label.prototype.initOptions = function (options) {
            var properties = {};
            lib.extend(properties, options);
            properties.tagName = this.main.nodeName.toLowerCase();
            if (options.text == null) {
                properties.text = lib.trim(lib.getText(this.main));
            }
            lib.extend(this, properties);
        };

        /**
         * 初始化DOM结构
         *
         * @override
         * @protected
         */
        Label.prototype.initStructure = function () {
            this.helper.delegateDOMEvent(this.main, 'click');
        };

        var allProperties = [
            { name: 'title' }, 
            { name: 'text' }
        ];

        /**
         * 渲染自身
         *
         * @override
         * @protected
         */
        Label.prototype.repaint = function (changes) {
            Control.prototype.repaint.apply(this, arguments);
            changes = changes || allProperties;

            var shouldRepaint = false;
            for (var i = 0; i < changes.length; i++) {
                var record = changes[i];

                if (record.name === 'title') {
                    this.main.title = lib.encodeHTML(this.title);
                }
                else {
                    shouldRepaint = true;
                }
            }

            if (shouldRepaint) {
                this.main.innerHTML = lib.encodeHTML(this.text);
            }
        };

        /**
         * 设置文本
         *
         * @param {string} text 文本内容
         */
        Label.prototype.setText = function (text) {
            this.setProperties({ text: text });
        };

        /**
         * 获取文本
         *
         * @return {string}
         */
        Label.prototype.getText = function () {
            return this.text;
        };

        /**
         * 设置title
         *
         * @param {string} title 需要设置的值
         * @public
         */
        Label.prototype.setTitle = function (title) {
            this.setProperties({ title: title });
        };

        /**
         * 获取title
         *
         * @return {string}
         * @public
         */
        Label.prototype.getTitle = function () {
            return this.title;
        };

        lib.inherits(Label, Control);
        require('./main').register(Label);
        return Label;
    }
);
