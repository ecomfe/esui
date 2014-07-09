/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 提示信息控件
 * @author lisijin, dbear, otakustay
 */
define(
    function (require) {
        var u = require('underscore');
        var Control = require('./Control');
        var ui = require('./main');

        require('./TipLayer');

        /**
         * 提示信息控件
         *
         * `Tip`控件是一个小图标，当鼠标移到图标上时，会出现一个层显示提示信息
         *
         * @extends Control
         * @requires TipLayer
         * @constructor
         */
        function Tip(options) {
            Control.apply(this, arguments);
        }

        /**
         * 控件类型，始终为`"Tip"`
         *
         * @type {string}
         * @readonly
         * @override
         */
        Tip.prototype.type = 'Tip';

        /**
         * 初始化参数
         *
         * @param {Object} [options] 构造函数传入的参数
         * @protected
         * @override
         */
        Tip.prototype.initOptions = function (options) {
            // 默认选项配置
            var properties = {
                title: '',
                content: '',
                /**
                 * @property {boolean} arrow
                 *
                 * 是否需要箭头
                 *
                 * 为了方便从DOM生成，此属性在初始化时如果为字符串`"false"`，
                 * 将被认为是布尔值`false`处理
                 *
                 * 具体参考{@link TipLayer#arrow}属性
                 */
                arrow: true,

                /**
                 * @property {string} showMode
                 *
                 * 指定信息浮层的显示方案，
                 * 具体参考{@link TipLayer#attachTo}方法的`showMode`参数的说明
                 */
                showMode: 'over',

                /**
                 * @property {number} delayTime
                 *
                 * 指定信息浮层的显示的延迟时间，以毫秒为单位，
                 * 具体参考{@link TipLayer#attachTo}方法的`delayTime`参数的说明
                 */
                delayTime: 500
            };
            if (options.arrow === 'false') {
                options.arrow = false;
            }

            extractDOMProperties(this.main, properties);

            u.extend(properties, options);

            this.setProperties(properties);
        };

        /**
         * 从DOM中抽取`title`和`content`属性，如果有的话优先级低于外部给定的
         *
         * @param {HTMLElement} 主元素
         * @param  {Object} options 构造函数传入的参数
         * @ignore
         */
        function extractDOMProperties(main, options) {
            options.title = options.title || main.getAttribute('title');
            main.removeAttribute('title');
            options.content = options.content || main.innerHTML;
            main.innerHTML = '';
        }

        /**
         * 初始化DOM结构
         *
         * @protected
         * @override
         */
        Tip.prototype.initStructure = function () {
            var main = document.createElement('div');
            document.body.appendChild(main);
            var tipLayer = ui.create(
                'TipLayer',
                {
                    main: main,
                    childName: 'layer',
                    content: this.content,
                    title: this.title,
                    arrow: this.arrow,
                    /**
                     * @property {number} [layerWidth=200]
                     *
                     * 指定信息浮层的宽度，具体参考{@link TipLayer#width}属性
                     */
                    width: this.layerWidth || 200,
                    viewContext: this.viewContext
                }
            );
            this.addChild(tipLayer);
            tipLayer.render();

            var attachOptions = {
                showMode: this.mode,
                delayTime: this.delayTime,
                targetControl: this,
                positionOpt: {top: 'top', right: 'left'}
            };
            tipLayer.attachTo(attachOptions);
        };

        /**
         * 重渲染
         *
         * @method
         * @protected
         * @override
         */
        Tip.prototype.repaint = require('./painters').createRepaint(
            Control.prototype.repaint,
            {
                name: 'title',
                paint: function (tip, value) {
                    var layer = tip.getChild('layer');
                    if (layer) {
                        layer.setTitle(value);
                    }
                }
            },
            {
                name: 'content',
                paint: function (tip, value) {
                    var layer = tip.getChild('layer');
                    if (layer) {
                        layer.setContent(value);
                    }
                }
            }
        );

        require('./lib').inherits(Tip, Control);
        ui.register(Tip);
        return Tip;
    }
);
