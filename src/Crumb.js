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
        var lib = require('./lib');
        var Control = require('./Control');

        /**
         * 面包屑导航条
         *
         * 就是一个简单的导航条，通过{@link Crumb#separator}分隔每个节点
         *
         * @extends Control
         * @constructor
         */
        function Crumb() {
            Control.apply(this, arguments);
        }

        /**
         * @cfg defaultProperties
         *
         * 默认属性值
         *
         * @cfg {string} [defaultProperties.separator=">"] 节点分隔符
         * @static
         */
        Crumb.defaultProperties = {
            separator: '>'
        };

        /**
         * 控件类型，始终为`"Crumb"`
         *
         * @type {string}
         * @readonly
         * @override
         */
        Crumb.prototype.type = 'Crumb';

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
        Crumb.prototype.initOptions = function (options) {
            var properties = {
                path: []
            };
            u.extend(properties, Crumb.defaultProperties, options);

            var children = lib.getChildren(this.main);
            if (!options.path && children.length) {
                // 从HTML中拿到数据，HTML中不要写separator
                properties.path = u.map(
                    children,
                    function (element) {
                        var node = {
                            text: lib.getText(element)
                        };
                        if (element.nodeName.toLowerCase() === 'a') {
                            node.href = lib.getAttribute(element, 'href');
                        }

                        return node;
                    }
                );
            }

            this.setProperties(properties);
        };


        /**
         * 无链接的文字节点的内容HTML模板
         *
         * 模板中可以使用以下占位符：
         *
         * - `{string} text`：文本内容，经过HTML转义
         *
         * @type {string}
         */
        Crumb.prototype.textNodeTemplate =
            '<span class="${classes}">${text}</span>';

        /**
         * 链接节点的内容HTML模板
         *
         * 模板中可以使用以下占位符：
         *
         * - `{string} text`：文本内容，经过HTML转义
         * - `{string} href`：链接地址，经过HTML转义
         *
         * @type {string}
         */
        Crumb.prototype.linkNodeTemplate =
            '<a class="${classes}" href="${href}">${text}</a>';

        /**
         * 分隔符HTML模板
         *
         * 模板中可以使用以下占位符：
         *
         * - `{string} classes`：节点需要使用的class名称
         * - `{string} text`：文本内容，经过HTML转义
         *
         * @type {string}
         */
        Crumb.prototype.separatorTemplate =
            '<span class="${classes}">${text}</span>';

        /**
         * 获取节点的HTML内容
         *
         * @param {meta.CrumbItem} node 节点数据项
         * @param {number} index 节点索引序号
         * @return {string}
         */
        Crumb.prototype.getNodeHTML = function (node, index) {
            var classes = this.helper.getPartClasses('node');
            if (index === 0) {
                classes.push.apply(
                    classes,
                    this.helper.getPartClasses('node-first')
                );
            }
            if (index === this.path.length - 1) {
                classes.push.apply(
                    classes,
                    this.helper.getPartClasses('node-last')
                );
            }

            var template = node.href
                ? this.linkNodeTemplate
                : this.textNodeTemplate;
            var data = {
                href: u.escape(node.href),
                text: u.escape(node.text),
                classes: classes.join(' ')
            };
            return lib.format(template, data);
        };

        /**
         * 获取分隔元素HTML内容
         *
         * @return {string}
         */
        Crumb.prototype.getSeparatorHTML = function () {
            return lib.format(
                this.separatorTemplate,
                {
                    classes: this.helper.getPartClassName('separator'),
                    text: u.escape(this.separator)
                }
            );
        };

        var paint = require('./painters');
        /**
         * 重渲染
         *
         * @method
         * @protected
         * @override
         */
        Crumb.prototype.repaint = paint.createRepaint(
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
                name: ['path', 'separator'],
                paint: function (crumb, path) {
                    var html = u.map(path, crumb.getNodeHTML, crumb);
                    var separator = crumb.getSeparatorHTML();

                    crumb.main.innerHTML = html.join(separator);
                }
            }
        );

        require('./main').register(Crumb);
        lib.inherits(Crumb, Control);

        return Crumb;
    }
);
