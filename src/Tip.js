/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 提示框
 * @author lisijin
 */

define(
    function (require) {
        var lib = require('./lib');
        var helper = require('./controlHelper');
        var Control = require('./Control');
        var ui = require('./main');

        require('./TipLayer');

        /**
         * 提示控件类
         * 
         * @constructor
         * @param {Object} options 初始化参数
         */
        function Tip(options) {
            Control.apply(this, arguments);
        }

        Tip.prototype.type = 'Tip';

        /**
         * 初始化参数
         *
         * @param {Object} options 构造函数传入的参数
         * @override
         * @protected
         */
        Tip.prototype.initOptions = function (options) {
            getDomProperties(options);
            /**
             * 默认选项配置
             */
            var properties = {
                title: '',
                content: '',
                arrow: true,
                showMode: 'over',
                delayTime: 500
            };
            if (options.arrow === 'false') {
                options.arrow = false;
            }

            lib.extend(properties, options);
            this.setProperties(properties);
        };

        /**
         * 从DOM中抽取title和content属性，如果有的话
         * 优先级低于data-ui
         * @param  {Object} options 构造函数传入的参数
         * 
         */
        function getDomProperties(options) {
            var main = options.main;
            options.title = options.title || main.getAttribute('title');
            main.removeAttribute('title');
            options.content = options.content || main.innerHTML;
            main.innerHTML = '';
        }
        /**
         * 创建主元素
         *
         * @param {Object} options 构造函数传入的参数
         * @return {HTMLElement} 主元素
         * @override
         * @protected
         */
        Tip.prototype.createMain = function (options) {
            return document.createElement('aside');
        };

        /**
         * 初始化DOM结构
         *
         * @override
         * @protected
         */
        Tip.prototype.initStructure = function () {
            //创建main
            var main = document.createElement('div');
            document.body.appendChild(main);
            var tipLayer = ui.create('TipLayer', {
                content: this.content,
                title: this.title,
                arrow: this.arrow,
                width: this.layerWidth || 200,
                main: main
            });
            tipLayer.render();
            this.tipLayer = tipLayer;
            tipLayer.attachTo({
                showMode: this.mode,
                delayTime: this.delayTime,
                targetControl: this,
                positionOpt: {top: 'top', right: 'left'}
            });
        };

        /**
         * 重绘
         *
         * @protected
         */
        Tip.prototype.repaint = helper.createRepaint(
            Control.prototype.repaint,
            {
                name: 'title',
                paint: function (tip, value) {
                    var layer = tip.tipLayer;
                    if (layer) {
                        layer.setTitle(value);
                    }
                }
            },
            {
                name: 'content',
                paint: function (tip, value) {
                    var layer = tip.tipLayer;
                    if (layer) {
                        layer.setContent(value);
                    }
                }
            }
        );

        /**
         * 销毁控件
         *
         * @override
         * @public
         */
        Tip.prototype.dispose = function () {
            if (helper.isInStage(this, 'DISPOSED')) {
                return;
            }
            
            var layer = this.tipLayer;
            if (layer) {
                layer.dispose();
            }

            Control.prototype.dispose.apply(this, arguments);
        };

        lib.inherits(Tip, Control);
        ui.register(Tip);
        return Tip;
    }
);