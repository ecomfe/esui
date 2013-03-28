/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file Link控件
 * @author miaojian
 */

define(
    function (require) {
        var lib     = require('./lib');
        var Control = require('./Control');
        var helper  = require('./controlHelper');

        /**
         * Label的默认选项
         *
         * @type {Object}
         * @inner
         * @const
         */
        var DEFAULT_OPTION = {
        };

        /**
         * Link控件
         *
         * @param {Object=} options 初始化参数
         * @constructor
         */
        function Link(options) {
            helper.init(this, options, DEFAULT_OPTION);

            helper.afterInit(this);
        }


        Link.prototype = {

            constructor: Link,

            /**
             * 控件类型
             * @type {string}
             */
            type: 'Link',

            /**
             * 创建控件主元素
             * @override
             * @return {HTMLElement}
             */
            createMain: function () {

                //主元素只能是a元素
                return document.createElement('a');
            },

            /**
             * 渲染控件
             * 
             * @override
             */
            render: function () {
                helper.beforeRender(this);
                helper.renderMain(this);

                var main   = this.main;

                //如果main主元素不是A,则放弃渲染
                if (main && main.tagName == 'A') {

                    // 初始化控件主元素上的行为
                    if (helper.isInited(this)) {
                        // 设置各种属性
                        this.href    && this.setHref(this.href);
                        this.content && this.setContent(this.content);
                        this.target  && this.setTarget(this.target);

                        main.onclick = lib.bind(this.clickHandler, this);
                    }

                }

                helper.afterRender(this);
            },

            /**
             * 设置链接地址
             *
             * @public
             * @param {string} href 链接地址
             */
            setHref: function (href) {

                this.main.href = href || '';
            },

            /**
             * 设置链接target
             *
             * @public
             * @param {string} target 链接target
             */
            setTarget: function (target) {

                this.main.target = target || '';
            },

            /**
             * 设置链接显示文本。经过html encode
             *
             * @public
             * @param {string} text 链接显示文本
             */
            setText: function (text) {

                this.disposeChildren();
                this.main.innerHTML = require('./lib').encodeHTML(text);
            },

            /**
             * 设置链接显示内容。 不经过html encode
             *
             * @param {[type]} html 链接显示内容
             */
            setContent: function (html) {

                this.disposeChildren();
                this.main.innerHTML = html;
                this.initChildren(this.main);
            },

            /**
             * 获取链接地址
             * @return {string} 地址
             */
            getHref: function () {

                return this.main ? this.main.href : '';
            },

            /**
             * 获取链接target
             * @return {string} target
             */
            getTarget: function () {

                return this.main ? this.main.target : '';
            },

            /**
             * 获取链接显示文本
             * @return {string} 显示文本
             */
            getText: function () {

                return this.main ? lib.getText(this.main) : '';
            },

            /**
             * 获取链接显示内容
             * @return {string} 显示内容
             */
            getContent: function () {

                return this.main ? this.main.innerHTML : '';
            },

            /**
             * 鼠标点击事件处理函数
             */
            clickHandler: function () {
                this.fire('click');
            },

            /**
             * 销毁释放控件
             * 
             * @override
             */
            dispose: function () {
                helper.beforeDispose(this);

                this.main && (this.main.onclick = null);

                helper.dispose(this);
                helper.afterDispose(this);
            }

        };

        require('./lib').inherits(Link, Control);
        require('./main').register(Link);
        return Link;
    }
);
