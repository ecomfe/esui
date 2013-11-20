/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 面包屑导航控件
 * @author otakustay
 */
define(
    function (require) {
        var u = require('underscore');
        var lib = require('./lib');
        var Control = require('./Control');

        /**
         * 面包屑导航控件
         *
         * @constructor
         * @extends Control
         */
        function Crumb() {
            Control.apply(this, arguments);
        }

        /**
         * 默认属性值
         *
         * @type {Object}
         */
        Crumb.defaultProperties = {
            separator: '>'
        };

        Crumb.prototype.type = 'Crumb';

        /**
         * 创建控件主元素
         *
         * @return {HTMLElement}
         * @protected
         * @override
         */
        Crumb.prototype.createMain = function () {
            return document.createElement('nav');
        };

        /**
         * 初始化参数
         *
         * @param {Object} [options] 构造函数传入的参数
         * @override
         * @protected
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
         * @type {string}
         */
        Crumb.prototype.textNodeTemplate = 
            '<span class="${classes}">${text}</span>';

        /**
         * 链接节点的内容HTML模板
         *
         * @type {string}
         */
        Crumb.prototype.linkNodeTemplate = 
            '<a class="${classes}" href="${href}">${text}</a>';

        /**
         * 分隔符HTML模板
         *
         * @type {string}
         */
        Crumb.prototype.separatorTemplate = 
            '<span class="${classes}">${text}</span>';

        /**
         * 获取节点的HTML内容
         *
         * @param {Object} node 节点数据项
         * @param {string=} node.href 链接地址
         * @param {string} node.text 显示文字
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
                separator = '';
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

        /**
         * 获取导航HTML
         *
         * @param {Crumb} crumb 控件实例
         * @param {Object[]} path 路径
         * @return {string}
         */
        function getHTML(crumb, path) {
            var html = u.map(path, crumb.getNodeHTML, crumb);
            var separator = crumb.getSeparatorHTML();

            return html.join(separator);
        }

        var paint = require('./painters');

        /**
         * 重渲染
         *
         * @override
         * @protected
         */
        Crumb.prototype.repaint = paint.createRepaint(
            Control.prototype.repaint,
            paint.html('path', null, getHTML)
        );

        require('./main').register(Crumb);
        lib.inherits(Crumb, Control);

        return Crumb;
    }
);