/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file Panel控件
 * @author otakustay
 */

define(
    function (require) {
        var u = require('underscore');
        var Control = require('./Control');
        var eoo = require('eoo');
        var painters = require('./painters');
        var esui = require('./main');
        var $ = require('jquery');

        /**
         * 通用面板
         *
         * 本身没有特别意义，仅作为一个容器存在，方便显示/隐藏等操作
         *
         * 需要特别注意的是，对面板进行`disable()`操作，并不会禁用其内部的控件，
         * 对控件进行批量禁用/启用操作，请使用{@link ViewContext#getGroup}
         * 及{@link ControlCollection}提供的相关方法
         *
         * @extends Control
         * @constructor
         */
        var Panel = eoo.create(
            Control,
            {
                /**
                 * 控件类型，始终为`"Panel"`
                 *
                 * @type {string}
                 * @readonly
                 * @override
                 */
                type: 'Panel',

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
                 * 初始化参数
                 *
                 * @param {Object} [options] 构造函数传入的参数
                 * @protected
                 * @override
                 */
                initOptions: function (options) {
                    var properties = {};
                    u.extend(properties, options);

                    this.setProperties(properties);
                },

                /**
                 * 重渲染
                 *
                 * @method
                 * @protected
                 * @override
                 */
                repaint: painters.createRepaint(
                    Control.prototype.repaint,
                    {
                        /**
                         * @property {string} content
                         *
                         * 面板的内容，为一个HTML片段
                         *
                         * 此属性中可包含ESUI相关的属性，在设置内容后，
                         * 会使用{@link Helper#initChildren}进行内部控件的初始化
                         */
                        name: 'content',
                        paint: function (panel, content) {
                            // 第一次刷新的时候是可能没有`content`的，
                            // 这时在`innerHTML`上就地创建控件，不要刷掉内容，
                            // 后续有要求`content`是字符串，所以不管非字符串的后果
                            if (content != null) {
                                panel.helper.disposeChildren();
                                panel.main.innerHTML = content;
                            }
                            panel.helper.initChildren();
                        }
                    }
                ),

                /**
                 * 设置内容
                 *
                 * @param {string} html 内容HTML，具体参考{@link Panel#content}属性的说明
                 */
                setContent: function (html) {
                    this.setProperties({content: html});
                },

                /**
                 * 在面板最前面追加内容
                 *
                 * @param {string} html 追加内容的HTML代码
                 */
                prependContent: function (html) {
                    addContent.call(this, html, true);
                },

                /**
                 * 在面板最后面追加内容
                 *
                 * @param {string} html 追加内容的HTML代码
                 */
                appendContent: function (html) {
                    addContent.call(this, html, false);
                }
            }
        );

        /**
         * 追加内容
         *
         * @param {string} html 追加内容的HTML代码
         * @param {boolean} isPrepend 是否加到面板最前面
         * @ignore
         */
        function addContent(html, isPrepend) {
            var jqMain = $(this.main);
            var container = document.createElement('div');
            container.innerHTML = html;

            var options = u.extend({}, this.renderOptions, {
                viewContext: this.viewContext,
                parent: this
            });

            if (isPrepend) {
                jqMain.prepend(container);
            }
            else {
                jqMain.append(container);
            }

            esui.init(container, options);
            $(container).contents().unwrap();
            // 直接追加到content属性，以防setContent时判断oldValue出现问题
            this.content = isPrepend ? html + this.content : this.content + html;
        }

        esui.register(Panel);
        return Panel;
    }
);
