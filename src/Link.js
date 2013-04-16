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
         * Link控件
         *
         * @param {Object=} options 初始化参数
         * @constructor
         */
        function Link(options) {
            Control.apply(this, arguments);
        }

        var allProperties = [
            { name: 'href' },
            { name: 'target' }, 
            { name: 'content' }
        ];

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
             * 初始化参数
             *
             * @param {Object=} options 构造函数传入的参数
             * @override
             * @protected
             */
            initOptions: function (options) {
                var properties = {};

                lib.extend(properties, options);

                if (options.href == null) {
                
                    properties.href = this.main.href;
                }

                if (options.target == null) {

                    properties.target = this.main.target;
                }

                //此处暂时放弃使用text,只是用content, 关于text, 控件使用者自己处理
                if (options.content == null) {
                
                    properties.content = this.main.innerHTML;
                }

                lib.extend(this, properties);
            },

            /**
             * 初始化DOM结构
             *
             * @protected
             */
            initStructure: function () {

                helper.addDOMEvent(
                    this, this.main, 'click',
                    lib.bind(this.clickHandler, null, this)
                );
            },

            /**
             * 渲染控件
             */
            render: function () {
                var main = this.main;

                //如果控件主元素不为A,则不执行渲染操作
                //目前处理是让其一直处于init状态下
                if (main && main.tagName == 'A') {

                    Control.prototype.render.apply(this, arguments);
                }
            },

            /**
             * 渲染自身
             *
             * @override
             * @protected
             */
            repaint: function (changes) {
                changes = changes || allProperties;

                for (var i = 0; i < changes.length; i++) {
                    var record = changes[i];

                    switch (record.name) {
                        case 'href':
                            this.main.href = this.href;
                            break;

                        case 'target':
                            this.main.target = this.target;
                            break;

                        case 'content':
                            this.disposeChildren();
                            this.main.innerHTML = this.content;
                            this.initChildren(this.main);
                            break;
                    }
                }
            },

            /**
             * 设置链接地址
             *
             * @public
             * @param {string} href 链接地址
             */
            setHref: function (href) {

                this.setProperties({ href: href });
            },

            /**
             * 设置链接target
             *
             * @public
             * @param {string} target 链接target
             */
            setTarget: function (target) {

                this.setProperties({ target: target });
            },

            /**
             * 设置链接显示内容。 不经过html encode
             *
             * @param {[type]} content 链接显示内容
             */
            setContent: function (content) {

                this.setProperties({ content: content });
            },

            /**
             * 获取链接地址
             * @return {string} 地址
             */
            getHref: function () {

                return this.href;
            },

            /**
             * 获取链接target
             * @return {string} target
             */
            getTarget: function () {

                return this.target;
            },

            /**
             * 获取链接显示内容
             * @return {string} 显示内容
             */
            getContent: function () {

                return this.content;
            },

            /**
             * 鼠标点击事件处理函数
             */
            clickHandler: function (link) {

                link.fire('click');
            }

        };

        require('./lib').inherits(Link, Control);
        require('./main').register(Link);
        return Link;
    }
);
