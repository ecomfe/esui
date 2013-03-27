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
            Control.call(this, options);
        }

        Label.prototype.type = 'Label';

        /**
         * 设置文本
         *
         * @param {string} text 文本内容
         */
        Label.prototype.setText = function (text) {
            this.disposeChildren();
            this.main.innerHTML = require('./lib').encodeHTML(text);
        };

        /**
         * 设置内容
         *
         * @param {string} html 内容HTML
         */
        Label.prototype.setContent = function (html) {
            this.disposeChildren();
            this.main.innerHTML = html;
            this.initChildren(this.main);
        };

        require('./lib').inherits(Label, Control);
        require('./main').register(Label);
        return Label;
    }
);
