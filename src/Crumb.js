/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 面包屑导航控件
 * @author otakustay
 */

define(
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var Control = require('./Control');

        /**
         * 面包屑导航控件
         *
         * @constructor
         */
        function Crumb() {
            Control.apply(this, arguments);
        }

        /**
         * 默认属性值
         *
         * @type {Object}
         * @public
         */
        Crumb.defaultProperties = {
            separator: '>'
        };

        Crumb.prototype.type = 'Crumb';

        /**
         * 创建控件主元素
         *
         * @return {HTMLElement}
         * @override
         * @protected
         */
        Crumb.prototype.createMain = function () {
            return document.createElement('nav');
        };

        /**
         * 初始化参数
         *
         * @param {Object=} options 构造函数传入的参数
         * @override
         * @protected
         */
        Crumb.prototype.initOptions = function (options) {
            var properties = {
                path: []
            };
            lib.extend(properties, Crumb.defaultProperties, options);

            var children = lib.getChildren(this.main);
            if (!options.path && children.length) {
                // 从HTML中拿到数据，HTML中不要写separator
                properties.path = [];
                for (var i = 0; i < children.length; i++) {
                    var element = children[i];
                    var node = {
                        text: lib.getText(element)
                    };
                    if (element.nodeName.toLowerCase() === 'a') {
                        node.href = lib.getAttribute(element, 'href');
                    }
                    properties.path.push(node);
                }
            }

            this.setProperties(properties);
        };


        /**
         * 无链接的文字节点的内容HTML模板
         *
         * @type {string}
         * @public
         */
        Crumb.prototype.textNodeTemplate = 
            '<span class="${classes}">${text}</span>';

        /**
         * 链接节点的内容HTML模板
         *
         * @type {string}
         * @public
         */
        Crumb.prototype.linkNodeTemplate = 
            '<a class="${classes}" href="${href}">${text}</a>';

        Crumb.prototype.separatorTemplate = 
            '<span class="${classes}">${text}</span>';

        /**
         * 获取节点的HTML内容
         *
         * @param {Object} node 节点数据项
         * @param {string=} node.href 链接地址
         * @param {string} node.text 显示文字
         * @param {string} classes 节点上的css类
         * @return {string}
         * @public
         */
        Crumb.prototype.getNodeHTML = function (node, classes) {
            var template = node.href
                ? this.linkNodeTemplate
                : this.textNodeTemplate;
            var data = {
                href: lib.encodeHTML(node.href),
                text: lib.encodeHTML(node.text),
                classes: classes
            };
            return lib.format(template, data);
        };

        /**
         * 获取分隔元素HTML内容
         *
         * @param {string} classes 节点上的css类
         * @return {string}
         * @public
         */
        Crumb.prototype.getSeparatorHTML = function (classes) {
            return lib.format(
                this.separatorTemplate,
                {
                    classes: classes,
                    text: this.separator
                }
            );
        };

        /**
         * 获取导航HTML
         *
         * @param {Crumb} crumb 面包屑控件实例
         * @param {Array} path 路径
         * @return {string}
         *
         * @inner
         */
        function getHTML(crumb, path) {
            var html = '';

            var separatorClasses =
                helper.getPartClasses(crumb, 'separator').join(' ');
            var separator = crumb.getSeparatorHTML(separatorClasses);

            for (var i = 0; i < path.length; i++) {
                var node = path[i];

                var classes = helper.getPartClasses(crumb, 'node');
                if (i === 0) {
                    classes = classes.concat(
                        helper.getPartClasses(crumb, 'node-first')
                    );
                }
                if (i === path.length - 1) {
                    classes = classes.concat(
                        helper.getPartClasses(crumb, 'node-last')
                    );
                    separator = '';
                }

                html += crumb.getNodeHTML(node, classes.join(' '));
                html += separator;
            }

            return html;
        }

        var paint = require('./painters');

        /**
         * 渲染自身
         *
         * @param {Array=} 变更过的属性的集合
         * @override
         * @protected
         */
        Crumb.prototype.repaint = helper.createRepaint(
            Control.prototype.repaint,
            paint.html('path', null, getHTML)
        );

        require('./main').register(Crumb);
        lib.inherits(Crumb, Control);

        return Crumb;
    }
);