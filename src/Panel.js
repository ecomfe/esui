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
        var helper = require('./controlHelper');
        var Control = require('./Control');

        /**
         * Panel控件
         *
         * @constructor
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
         * @override
         * @protected
         */
        Panel.prototype.createMain = function (options) {
            return document.createElement(options.tagName || 'div');
        };

        Panel.prototype.initOptions = function (options) {
            var properties = {};
            lib.extend(properties, options);
            properties.tagName = this.main.nodeName.toLowerCase();
            lib.extend(this, properties);
        };

        /**
         * 渲染自身
         *
         * @param {Array=} 变更过的属性的集合
         * @override
         * @protected
         */
        Panel.prototype.repaint = helper.createRepaint(
            Control.prototype.repaint,
            {
                name: 'content',
                paint: function (control, content) {
                    // 第一次刷新的时候是可能没有`content`的，
                    // 这时在`innerHTML`上就地创建控件，不要刷掉内容，
                    // 后续有要求`content`是字符串，所以不管非字符串的后果
                    if (content != null) {
                        control.disposeChildren();
                        control.main.innerHTML = content;
                    }
                    control.initChildren(control.main);
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

        lib.inherits(Panel, Control);
        require('./main').register(Panel);
        return Panel;
    }
);
