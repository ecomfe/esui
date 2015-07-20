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
        var Control = require('./Control');
        var painters = require('./painters');
        var eoo = require('eoo');
        var esui = require('./main');
        var $ = require('jquery');

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
        var Link = eoo.create(
            Control,
            {
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

                    if (properties.href == null) {
                        properties.href = this.main.href;
                    }

                    if (properties.target == null) {
                        properties.target = this.main.target;
                    }

                    // 此处暂时放弃使用text，只是用content, 关于text, 控件使用者自己处理
                    if (properties.content == null) {
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
                    if ($(this.main).is('a')) {
                        this.$super(arguments);
                    }
                    else {
                        alert('Invalid Tag: Only a element is allowed.');
                    }
                },

                /**
                 * 重渲染
                 *
                 * @protected
                 * @override
                 */
                repaint: painters.createRepaint(
                    Control.prototype.repaint,
                    /**
                     * @property {string} href
                     *
                     * 链接地址
                     */
                    painters.attribute('href'),
                    /**
                     * @property {string} target
                     *
                     * 链接打开目标，与DOM中对应属性相同
                     */
                    painters.attribute('target'),
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
            }
        );

        esui.register(Link);
        return Link;
    }
);
