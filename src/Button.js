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
         * 默认选项配置
         * 
         * @const
         * @inner
         * @type {Object}
         */
        var DEFAULT_OPTION = {
            content: '',         // 按钮的显示文字
            disabled: false     // 控件是否禁用
        };

        /**
         * 按钮控件类
         * 
         * @constructor
         * @param {Object} options 初始化参数
         */
        function Button(options) {
            Control.apply(this, arguments);
        };

        /**
         * 构建main的主内容
         *
         * @param {string} type foot | body 
         * @inner
         */
        function getMainHtml(control, type) {
            var me = control;
            var data = {
                lfIconId: helper.getId(me, 'lf-icon'),
                lfIconClass: helper.getClasses(me, 'lf-icon').join(' '),
                labelId: helper.getId(me, 'label'),
                labelClass: helper.getClasses(me, 'label').join(' '),
                btnLabel: me.content || '&nbsp;',
                rtIconId: helper.getId(me, 'rt-icon'),
                rtIconClass: helper.getClasses(me, 'rt-icon').join(' ')
            };
            var innerHtml = lib.format(tplButton, data);
            return innerHtml;

        };

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
            initOptions: function(options) {
                options = lib.extend(options, DEFAULT_OPTION);
                if (options.main) {
                    options.tagName = options.main.nodeName.toLowerCase();
                    if (options.text == null) {
                        options.text = lib.getText(options.main);
                    }
                    var innerDiv = options.main.firstChild;
                    if (!options.content 
                        && innerDiv 
                        && innerDiv.tagName != 'DIV'
                    ) {
                        options.content = options.main.innerHTML;
                    }
                }
                this.setProperties(options);
            },

            /**
             * 创建控件主元素
             *
             * @param {Object=} options 构造函数传入的参数
             * @override
             */
            createMain: function (options) {
                this.main = document.createElement('button');
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

                // 初始化状态事件
                main.onclick = lib.bind(this.clickHandler, this);
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
                this.content = content;
                if ( this.lifeCycle == Control.LifeCycle.RENDERED) {
                    this.repaint({'content': content});
                }
            },

            /**
             * 销毁释放控件
             * 
             * @override
             */
            dispose: function () {
                helper.beforeDispose(this);

                var main = this.main;
                if (main) {
                    main.onclick = null;
                }

                helper.dispose(this);
                helper.afterDispose(this);
            }
        };

        lib.inherits(Button, Control);
        ui.register(Button);

        return Button;
    }
);
