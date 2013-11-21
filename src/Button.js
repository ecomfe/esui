/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 按钮
 * @author dbear
 */
define(
    function (require) {
        var u = require('underscore');
        var lib = require('./lib');
        var paint = require('./painters');
        var Control = require('./Control');

        /**
         * 按钮控件类
         * 
         * @constructor
         * @param {Object} options 初始化参数
         */
        function Button(options) {
            Control.apply(this, arguments);
        }

        /**
         * 获取元素border信息
         * 
         * @param {HTMLElement} dom 目标元素
         * @return {object}
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
             * 控件类型
             * 
             * @type {string}
             */
            type: 'Button',

            /**
             * 初始化参数
             *
             * @param {Object=} options 构造函数传入的参数
             * @override
             * @protected
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
             * 创建控件主元素
             *
             * @param {Object=} options 构造函数传入的参数
             * @return {HTMLElement}
             * @override
             */
            createMain: function (options) {
                // IE创建带`type`属性的元素很麻烦，干脆这么来
                var div = document.createElement('div');
                div.innerHTML = '<button type="button"></button>';
                return div.firstChild;
            },

            /**
             * 初始化DOM结构
             *
             * @protected
             */
            initStructure: function () {
                // 初始化状态事件
                this.helper.delegateDOMEvent(this.main, 'click');
            },
            
            /**
             * 重新渲染视图
             * 仅当生命周期处于RENDER时，该方法才重新渲染
             *
             * @param {Array=} 变更过的属性的集合
             * @override
             */
            repaint: paint.createRepaint(
                Control.prototype.repaint,
                paint.style('width'),
                {
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
                            height = value
                                + borderInfo.borderTop
                                + borderInfo.borderBottom;
                            main.style.height = height + 'px';
                        }
                    } 
                },
                paint.html('content')
            ),

            /**
             * 设置内容
             *
             * @param {string} content 要设置的内容.
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
