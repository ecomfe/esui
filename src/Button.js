/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 按钮
 * @author dbear, otakustay
 */
define(
    function (require) {
        var u = require('underscore');
        var lib = require('./lib');
        var paint = require('./painters');
        var Control = require('./Control');

        /**
         * 按钮控件
         *
         * @extends Control
         * @constructor
         */
        function Button(options) {
            Control.apply(this, arguments);
        }

        /**
         * 获取元素border信息
         *
         * @param {HTMLElement} dom 目标元素
         * @return {Object}
         * @ignore
         */
        function getBorderInfo(dom) {
            var result = {};
            result.borderTop =
                parseInt(lib.getComputedStyle(dom, 'borderTopWidth'), 10);
            result.borderBottom =
                parseInt(lib.getComputedStyle(dom, 'borderBottomWidth'), 10);
            return result;
        }

        Button.prototype = {
            /**
             * 控件类型，始终为`"Button"`
             *
             * @type {string}
             * @readonly
             * @override
             */
            type: 'Button',

            /**
             * 初始化参数
             *
             * @param {Object} [options] 构造函数传入的参数
             * @protected
             * @override
             */
            initOptions: function (options) {
                /**
                 * 默认选项配置
                 */
                var properties = {
                    content: '', // 按钮的显示文字
                    disabled: false // 控件是否禁用
                };
                u.extend(properties, options);
                properties.tagName = this.main.nodeName.toLowerCase();
                if (properties.text == null) {
                    properties.text = lib.getText(this.main);
                }
                var innerDiv = this.main.firstChild;
                if (!properties.content
                    && innerDiv
                    && innerDiv.nodeName.toLowerCase() !== 'div'
                ) {
                    properties.content = this.main.innerHTML;
                }

                this.setProperties(properties);
            },

            /**
             * 创建控件主元素，默认使用`<button type="button">`元素
             *
             * 如果需要使用其它类型作为主元素，
             * 需要在始终化时提供{@link Control#main}属性
             *
             * @return {HTMLElement}
             * @protected
             * @override
             */
            createMain: function () {
                // IE创建带`type`属性的元素很麻烦，干脆这么来
                var div = document.createElement('div');
                div.innerHTML = '<button type="button"></button>';
                return div.firstChild;
            },

            /**
             * 初始化事件交互
             *
             * @protected
             * @override
             */
            initEvents: function () {
                /**
                 * @event click
                 *
                 * 点击时触发
                 */
                this.helper.delegateDOMEvent(this.main, 'click');
            },

            /**
             * 重新渲染
             *
             * @method
             * @protected
             * @override
             */
            repaint: paint.createRepaint(
                Control.prototype.repaint,
                /**
                 * @property {number} width
                 *
                 * 宽度
                 */
                paint.style('width'),
                {
                    /**
                     * @property {number} height
                     *
                     * 高度
                     */
                    name: 'height',
                    paint: function (button, value) {
                        if (!value) {
                            return;
                        }
                        var main = button.main;
                        main.style.height = value + 'px';
                        var lineHeight = value;
                        main.style.lineHeight = lineHeight + 'px';

                        var offsetHeight = main.offsetHeight;
                        // 说明是border-box模式
                        if (offsetHeight === value) {
                            var borderInfo = getBorderInfo(main);
                            var height = value
                                + borderInfo.borderTop
                                + borderInfo.borderBottom;
                            main.style.height = height + 'px';
                        }
                    }
                },
                /**
                 * @property {string} [content=""]
                 *
                 * 按钮的文本内容，不作HTML转义
                 */
                paint.html('content'),
                {
                    name: 'disabled',
                    paint: function (button, disabled) {
                        var nodeName = button.main.nodeName.toLowerCase();
                        if (nodeName === 'button' || nodeName === 'input') {
                            button.main.disabled = !!disabled;
                        }
                    }
                }
            ),

            /**
             * 设置内容
             *
             * @param {string} content 要设置的内容
             */
            setContent: function (content) {
                this.setProperties({ 'content': content });
            }
        };

        lib.inherits(Button, Control);
        require('./main').register(Button);

        return Button;
    }
);
