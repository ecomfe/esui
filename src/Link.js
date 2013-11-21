/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file Link控件
 * @author miaojian
 */
define(
    function (require) {
        var lib = require('./lib');
        var Control = require('./Control');
        var paint = require('./painters');

        /**
         * Link控件
         *
         * @constructor
         */
        function Link() {
            Control.apply(this, arguments);
        }

        Link.prototype = {
            constructor: Link,

            /**
             * 控件类型
             *
             * @type {string}
             */
            type: 'Link',

            /**
             * 创建控件主元素
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
             * @param {Object} [options] 构造函数传入的参数
             * @protected
             * @override
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
             * @override
             */
            initStructure: function () {
                this.helper.delegateDOMEvent(this.main, 'click');
            },

            /**
             * 渲染控件
             */
            render: function () {
                // 如果控件主元素不为A,则不执行渲染操作
                // 目前处理是让其一直处于init状态下
                if (this.main && this.main.nodeName.toLowerCase() === 'a') {
                    Control.prototype.render.apply(this, arguments);
                }
            },

            /**
             * 渲染自身
             *
             * @protected
             * @override
             */
            repaint: paint.createRepaint(
                Control.prototype.repaint,
                paint.attribute('href'),
                paint.attribute('target'),
                {
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
