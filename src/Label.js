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
         * 初始化参数
         *
         * @param {Object=} options 构造函数传入的参数
         * @override
         * @protected
         */
        Label.prototype.initOptions = function (options) {
            var defaults = {
                tagName: 'span'
            };
            var lib = require('./lib');
            options = lib.extend(defaults, options);
            if (options.main) {
                options.tagName = options.main.nodeName.toLowerCase();
                if (options.text == null) {
                    options.text = lib.getText(options.main);
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
        Label.prototype.createMain = function () {
            return document.createElement(this.tagName);
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
            changes = changes || allProperties;

            var lib = require('./lib');
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

        require('./lib').inherits(Label, Control);
        require('./main').register(Label);
        return Label;
    }
);
