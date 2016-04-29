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
        var painters = require('./painters');
        var Control = require('./Control');
        var $ = require('jquery');
        var esui = require('./main');
        var eoo = require('eoo');

        /**
         * 按钮控件
         *
         * @extends Control
         * @constructor
         */
        var Button = eoo.create(
            Control,
            {
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
                        width: null,
                        height: null,
                        content: null,
                        disabled: false
                    };
                    u.extend(properties, options);
                    if (!properties.content) {
                        properties.content = this.main.innerHTML;
                    }

                    this.setProperties(properties);
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
                repaint: painters.createRepaint(
                    Control.prototype.repaint,
                    {
                        /**
                         * @property {number} width
                         *
                         * 宽度
                         */
                        name: 'width',
                        paint: function (button, value) {
                            if (!value) {
                                return;
                            }
                            var $main = $(button.main);
                            $main.css('width', value);
                        }
                    },
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
                            var $main = $(button.main);
                            $main.css(
                                {
                                    height: value,
                                    lineHeight: value
                                }
                            );
                        }
                    },
                    /**
                     * @property {string} content
                     *
                     * 按钮的文本内容，不作HTML转义
                     */
                    {
                        name: 'content',
                        paint: function (button, content) {
                            var jqEle = $(button.main);
                            if (content !== jqEle.html()) {
                                jqEle.html(content);
                            }
                        }
                    },
                    /**
                     * @property {Boolean} [disabled=false]
                     *
                     * 按钮的文本内容，不作HTML转义
                     */
                    {
                        name: 'disabled',
                        paint: function (button, disabled) {
                            var $ele = $(button.main);
                            if ($ele.is('button,input')) {
                                $ele.attr('disabled', !!disabled);
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
                    this.setProperties({content: content});
                }
            }
        );

        esui.register(Button);
        return Button;
    }
);
