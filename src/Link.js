/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 链接控件
 * @author miaojian, otakustay
 */
define(
    function (require) {
        var u = require('underscore');
        var lib = require('./lib');
        var Control = require('./Control');
        var paint = require('./painters');

        /**
         * 链接控件
         *
         * 很单纯的可以点击的链接，对`<a>`元素的封装
         *
         * 本控件只能使用`<a>`元素作为主元素，如果主元素使用了其它DOM元素，会无法渲染
         *
         * @extends Control
         * @constructor
         */
        function Link() {
            Control.apply(this, arguments);
        }

        Link.prototype = {
            constructor: Link,

            /**
             * 控件类型，始终为`"Link"`
             *
             * @type {string}
             * @readonly
             * @override
             */
            type: 'Link',

            /**
             * 获取控件的分类
             *
             * @return {string} 始终返回`"container"`
             * @override
             */
            getCategory: function () {
                return 'container';
            },

            /**
             * 创建控件主元素，始终创建`<a>`元素
             *
             * @return {HTMLElement}
             * @protected
             * @override
             */
            createMain: function () {
                // 主元素只能是a元素
                return document.createElement('a');
            },

            /**
             * 初始化参数
             *
             * 如果初始化配置未给定相关属性，则会从主元素上按以下规则获取：
             *
             * - {@link Link#href}属性使用主元素的`href`属性
             * - {@link Link#target}属性使用主元素的`target`属性
             * - {@link Link#content}属性使用主元素的`innerHTML`
             *
             * @param {Object} [options] 构造函数传入的参数
             * @protected
             * @override
             */
            initOptions: function (options) {
                var properties = {};

                u.extend(properties, options);

                if (options.href == null) {
                    properties.href = this.main.href;
                }

                if (options.target == null) {
                    properties.target = this.main.target;
                }

                //此处暂时放弃使用text，只是用content, 关于text, 控件使用者自己处理
                if (options.content == null) {
                    properties.content = this.main.innerHTML;
                }

                u.extend(this, properties);
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
                 * 点击时触发，可取消默认行为（链接跳转）
                 *
                 * @preventable
                 */
                this.helper.delegateDOMEvent(this.main, 'click');
            },

            /**
             * 渲染控件
             *
             * @method
             * @protected
             * @override
             */
            render: function () {
                // 如果控件主元素不为`<a>`，则不执行渲染操作
                // 目前处理是让其一直处于`init`状态下
                if (this.main && this.main.nodeName.toLowerCase() === 'a') {
                    Control.prototype.render.apply(this, arguments);
                }
            },

            /**
             * 重渲染
             *
             * @protected
             * @override
             */
            repaint: paint.createRepaint(
                Control.prototype.repaint,
                /**
                 * @property {string} href
                 *
                 * 链接地址
                 */
                paint.attribute('href'),
                /**
                 * @property {string} target
                 *
                 * 链接打开目标，与DOM中对应属性相同
                 */
                paint.attribute('target'),
                {
                    /**
                     * @property {string} content
                     *
                     * 链接内的内容，不进行HTML转义
                     *
                     * 内容支持内部控件，参考{@link Panel#content}属性的说明
                     */
                    name: 'content',
                    paint: function (link, content) {
                        link.helper.disposeChildren();
                        link.main.innerHTML = content;
                        link.helper.initChildren();
                    }
                }
            )

        };

        lib.inherits(Link, Control);
        require('./main').register(Link);
        return Link;
    }
);
