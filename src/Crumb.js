/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 面包屑导航控件
 * @author otakustay
 */

define(
    function (require) {
        var u = require('underscore');
        var $ = require('jquery');
        var lib = require('./lib');
        var Control = require('./Control');
        var painters = require('./painters');
        var esui = require('./main');
        var eoo = require('eoo');

        /**
         * 面包屑导航条
         *
         * 就是一个简单的导航条，通过{@link Crumb#separator}分隔每个节点
         *
         * @extends Control
         * @constructor
         */
        var Crumb = eoo.create(
            Control,
            {
                /**
                 * 控件类型，始终为`"Crumb"`
                 *
                 * @type {string}
                 * @readonly
                 * @override
                 */
                type: 'Crumb',

                /**
                 * 初始化参数
                 *
                 * 如果初始化时未提供{@link Crumb#path}属性，则按以下规则构建该属性：
                 *
                 * 1. 获取主元素的所有子元素
                 * 2. 对每个子元素，获取其文本内容为{@link meta.CrumbItem#text}属性
                 * 3. 如果子元素是`<a>`元素，
                 * 获取其`href`属性为配置项的{@link meta.CrumbItem#href}属性
                 *
                 * 因此 *不要* 在主元素下写分隔符
                 *
                 * @param {Object} [options] 构造函数传入的参数
                 * @protected
                 * @override
                 */
                initOptions: function (options) {
                    var properties = {
                        path: []
                    };
                    u.extend(properties, Crumb.defaultProperties, options);

                    var $children = $(this.main).children();
                    if (!options.path && $children.size() > 0) {
                        // 从HTML中拿到数据，HTML中不要写separator
                        $children.each(function (idx, element) {
                            var $ele = $(element);
                            var node = {
                                text: $ele.text()
                            };
                            if ($ele.is('a')) {
                                node.href = $ele.attr('href');
                            }
                            properties.path.push(node);
                        });
                    }

                    this.setProperties(properties);
                },

                initEvents: function () {
                    var nodeSelector = '.'
                        + this.helper.getPrimaryClassName('node');
                    this.helper.addDOMEvent(this.main, 'click', nodeSelector, click);
                },

                /**
                 * 获取节点的HTML内容
                 *
                 * @param {meta.CrumbItem} node 节点数据项
                 * @param {number} index 节点索引序号
                 * @return {string}
                 */
                getNodeHTML: function (node, index) {
                    var controlHelper = this.helper;
                    var classes = [controlHelper.getPrimaryClassName('node')];
                    if (index === 0) {
                        classes.push(
                            controlHelper.getPrimaryClassName('node-first')
                        );
                    }
                    if (index === this.path.length - 1) {
                        classes.push(
                            controlHelper.getPrimaryClassName('node-last')
                        );
                    }

                    var template = node.href
                        ? this.linkNodeTemplate
                        : this.textNodeTemplate;
                    var data = {
                        href: u.escape(node.href),
                        text: u.escape(node.text),
                        index: index,
                        classes: classes.join(' ')
                    };
                    return lib.format(template, data);
                },

                /**
                 * 获取分隔元素HTML内容
                 *
                 * @return {string}
                 */
                getSeparatorHTML: function () {
                    var separatorClass = this.separatorClass;
                    return lib.format(
                        this.separatorTemplate,
                        {
                            classes: separatorClass
                                + ' '
                                + this.helper.getPartClassName('separator'),
                            text: u.escape(this.separator)
                        }
                    );
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
                         * @property {meta.CrumbItem[]} path
                         *
                         * 数据源配置，数组中的每一项生成一个节点
                         */

                        /**
                         * @property {string} separator
                         *
                         * 分隔符，默认使用{@link Crumb#defaultProperties}中的配置
                         */
                        name: ['path', 'separator', 'separatorClass'],
                        paint: function (crumb, path) {
                            var html = u.map(path, crumb.getNodeHTML, crumb);
                            var separator = crumb.getSeparatorHTML();

                            crumb.main.innerHTML = html.join(separator);
                        }
                    }
                )
            }
        );

        Crumb.defaultProperties = {
            /**
             * @cfg defaultProperties
             *
             * 默认属性值
             *
             * @cfg {string} [defaultProperties.separator=">"] 节点分隔符
             * @static
             */
            separator: '>',

            /**
             * @cfg defaultProperties
             *
             * 默认属性值
             *
             * @cfg {string} [defaultProperties.separatorClass=""] 节点分要加自定义class
             * @static
             */
            separatorClass: '',
            /**
             * 无链接的文字节点的内容HTML模板
             *
             * 模板中可以使用以下占位符：
             *
             * - `{string} text`：文本内容，经过HTML转义
             *
             * @type {string}
             * @static
             */
            textNodeTemplate:
                '<span class="${classes}" data-index="${index}">${text}</span>',

            /**
             * 链接节点的内容HTML模板
             *
             * 模板中可以使用以下占位符：
             *
             * - `{string} text`：文本内容，经过HTML转义
             * - `{string} href`：链接地址，经过HTML转义
             *
             * @type {string}
             * @static
             */
            linkNodeTemplate:
                '<a class="${classes}" href="${href}" data-index="${index}">${text}</a>',

            /**
             * 分隔符HTML模板
             *
             * 模板中可以使用以下占位符：
             *
             * - `{string} classes`：节点需要使用的class名称
             * - `{string} text`：文本内容，经过HTML转义
             *
             * @type {string}
             * @static
             */
            separatorTemplate:
                '<span class="${classes}">${text}</span>'
        };

        function click(e) {
            var $node = $(e.currentTarget);
            var dataIndex = $node.attr('data-index');

            dataIndex = parseInt(dataIndex, 10) || ($node.prevAll().size() / 2);
            var returnedEvent = this.fire('click', {item: this.path[dataIndex], index: dataIndex});
            returnedEvent.isDefaultPrevented() && e.preventDefault();
            returnedEvent.isPropagationStopped() && e.stopPropagation();
        }

        esui.register(Crumb);
        return Crumb;
    }
);
