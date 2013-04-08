/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 按钮
 * @author dbear
 */

define(
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var Control = require('./Control');
        var ui = require('./main');

        /**
         * 按钮控件类
         * 
         * @constructor
         * @param {Object} options 初始化参数
         */
        function Button(options) {
            Control.apply(this, arguments);
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
                    content: '',         // 按钮的显示文字
                    disabled: false     // 控件是否禁用
                };
                lib.extend(properties, options);
                properties.tagName = this.main.nodeName.toLowerCase();
                if (properties.text == null) {
                    properties.text = lib.getText(this.main);
                }
                var innerDiv = this.main.firstChild;
                if (!properties.content 
                    && innerDiv 
                    && innerDiv.tagName != 'DIV'
                ) {
                    properties.content = this.main.innerHTML;
                }
                lib.extend(this, properties);
            },

            /**
             * 创建控件主元素
             *
             * @param {Object=} options 构造函数传入的参数
             * @return {HTMLElement}
             * @override
             */
            createMain: function (options) {
                return document.createElement('BUTTON');
            },

            /**
             * 重新渲染视图
             * 仅当生命周期处于RENDER时，该方法才重新渲染
             *
             * @param {Array=} 变更过的属性的集合
             * @override
             */
            repaint: function (changes) {
                var main = this.main;
                main.innerHTML = this.content;
                if (this.height) {
                    main.style.height = this.height + 'px';
                    main.style.lineHeight = this.height + 'px';
                }
                if (this.width) {
                    main.style.width = this.width + 'px';
                }

                // 初始化状态事件
                helper.addDOMEvent(this, main, 'click', this.clickHandler);
                helper.initMouseBehavior(this);

            },

            /**
             * 鼠标点击事件处理函数
             */
            clickHandler: function () {
                this.fire('click');
            },

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
        ui.register(Button);

        return Button;
    }
);
