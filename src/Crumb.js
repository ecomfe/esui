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

        // css
        require('css!./css/Crumb.css');
        /**
         * 面包屑导航控件
         *
         * @constructor
         */
        function Crumb() {
            Control.apply(this, arguments);
        }

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
                path: [],
                separator: '>'
            };
            lib.extend(properties, options);
            this.setProperties(properties);
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
            var html = '<ol>';

            var separatorClasses =
                helper.getPartClasses(crumb, 'separator').join(' ');
            var separator = lib.format(
                '<li class="${classes}">${text}</li>',
                {
                    classes: separatorClasses, 
                    text: lib.encodeHTML(crumb.separator)
                }
            );

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

                html += '<li class="' + classes + '">';

                var template = node.href
                    ? '<a href="${href}">${text}</a>'
                    : '<span>${text}</span>';

                html += lib.format(template, node);

                html += '</li>';

                html += separator;

            }

            html += '</ol>';

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